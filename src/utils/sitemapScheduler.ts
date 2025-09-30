import { saveSitemap } from './sitemap';

export class SitemapScheduler {
  private static instance: SitemapScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): SitemapScheduler {
    if (!SitemapScheduler.instance) {
      SitemapScheduler.instance = new SitemapScheduler();
    }
    return SitemapScheduler.instance;
  }

  public start(): void {
    if (this.isRunning) {
      console.log('Le planificateur de sitemap est déjà en cours d\'exécution');
      return;
    }

    console.log('Démarrage du planificateur de sitemap');
    this.isRunning = true;

    // Générer le sitemap immédiatement
    this.generateSitemap();

    // Planifier la génération quotidienne à 6h00
    this.scheduleDaily();
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Planificateur de sitemap arrêté');
  }

  private scheduleDaily(): void {
    // Calculer le temps jusqu'à 6h00 du matin
    const now = new Date();
    const tomorrow6AM = new Date();
    tomorrow6AM.setDate(now.getDate() + 1);
    tomorrow6AM.setHours(6, 0, 0, 0);

    const timeUntil6AM = tomorrow6AM.getTime() - now.getTime();

    // Programmer la première exécution à 6h00
    setTimeout(() => {
      this.generateSitemap();
      
      // Puis répéter toutes les 24 heures
      this.intervalId = setInterval(() => {
        this.generateSitemap();
      }, 24 * 60 * 60 * 1000); // 24 heures en millisecondes
      
    }, timeUntil6AM);

    console.log(`Prochaine génération de sitemap programmée dans ${Math.round(timeUntil6AM / 1000 / 60)} minutes`);
  }

  private async generateSitemap(): Promise<void> {
    try {
      console.log('Génération automatique du sitemap...', new Date().toISOString());
      await saveSitemap();
      console.log('Sitemap généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération automatique du sitemap:', error);
    }
  }

  public async generateNow(): Promise<void> {
    await this.generateSitemap();
  }
}

// Démarrer automatiquement le planificateur
if (typeof window !== 'undefined') {
  const scheduler = SitemapScheduler.getInstance();
  scheduler.start();
  
  // Arrêter le planificateur quand la page se ferme
  window.addEventListener('beforeunload', () => {
    scheduler.stop();
  });
}

export default SitemapScheduler;