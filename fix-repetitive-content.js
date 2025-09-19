import { createClient } from '@supabase/supabase-js';

// Configuration Supabase Cloud
const supabaseUrl = 'https://lqldqgbpaxqaazfjzlsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRepetitiveContent() {
  console.log('🔧 Correction du contenu répétitif...\n');

  try {
    // Récupérer toutes les demandes avec contenu personnalisé
    const { data: requests, error } = await supabase
      .from('link_purchase_requests')
      .select('id, custom_content, content_option')
      .eq('content_option', 'custom')
      .not('custom_content', 'is', null);

    if (error) {
      console.log('❌ Erreur:', error.message);
      return;
    }

    if (!requests || requests.length === 0) {
      console.log('⚠️ Aucune demande avec contenu personnalisé trouvée');
      return;
    }

    console.log(`✅ ${requests.length} demande(s) trouvée(s):\n`);

    for (const request of requests) {
      const content = request.custom_content;
      console.log(`📄 Demande ${request.id}:`);
      console.log(`📝 Contenu actuel: "${content.substring(0, 100)}..."`);
      
      // Détecter les patterns répétitifs
      const isRepetitive = content.length > 50 && (
        /^(.)\1{20,}/.test(content) || // Caractère unique répété 20+ fois
        /^([a-z]{3,})\1{5,}/.test(content) || // Mot de 3+ lettres répété 5+ fois
        content.match(/(.{3,})\1{3,}/) // Pattern de 3+ caractères répété 3+ fois
      );
      
      if (isRepetitive) {
        console.log(`🔍 Contenu répétitif détecté!`);
        
        // Extraire le pattern unique
        let cleanContent = content;
        
        // Méthode 1: Extraire le premier pattern unique
        const uniquePattern = content.match(/^(.{1,10})/)?.[1];
        if (uniquePattern && content.startsWith(uniquePattern.repeat(Math.floor(content.length / uniquePattern.length)))) {
          cleanContent = uniquePattern;
        }
        
        // Méthode 2: Si c'est un seul caractère répété
        const singleCharMatch = content.match(/^(.)\1+$/);
        if (singleCharMatch) {
          cleanContent = singleCharMatch[1];
        }
        
        // Créer le contenu HTML final
        const htmlContent = `<p>Contenu personnalisé: ${cleanContent}</p>`;
        
        console.log(`🔧 Contenu nettoyé: "${cleanContent}"`);
        console.log(`📝 HTML généré: "${htmlContent}"`);
        
        // Mettre à jour en base
        const { error: updateError } = await supabase
          .from('link_purchase_requests')
          .update({ custom_content: htmlContent })
          .eq('id', request.id);
          
        if (updateError) {
          console.log(`❌ Erreur lors de la mise à jour: ${updateError.message}`);
        } else {
          console.log(`✅ Demande ${request.id} mise à jour avec succès`);
        }
      } else {
        console.log(`ℹ️ Contenu normal, pas de correction nécessaire`);
      }
      
      console.log('─'.repeat(60));
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

fixRepetitiveContent().catch(console.error);
