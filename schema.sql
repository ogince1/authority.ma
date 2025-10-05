


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accept_purchase_request"("p_request_id" "uuid", "p_placed_url" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Récupérer les détails de la demande
  SELECT * INTO v_request 
  FROM link_purchase_requests 
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;
  
  -- Mettre à jour le statut et les champs
  UPDATE link_purchase_requests 
  SET 
    status = 'pending_confirmation',
    accepted_at = NOW(),
    confirmation_deadline = NOW() + INTERVAL '48 hours',
    placed_url = COALESCE(p_placed_url, placed_url),
    updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."accept_purchase_request"("p_request_id" "uuid", "p_placed_url" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."accept_purchase_request"("p_request_id" "uuid", "p_placed_url" "text") IS 'Accepte une demande d''achat et la met en attente de confirmation';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."balance_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "user_email" "text" NOT NULL,
    "user_name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_method" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "description" "text",
    "payment_reference" "text",
    "publisher_payment_info" "jsonb",
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    "processed_by" "uuid",
    CONSTRAINT "balance_requests_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "balance_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'completed'::"text"]))),
    CONSTRAINT "balance_requests_type_check" CHECK (("type" = ANY (ARRAY['add_funds'::"text", 'withdraw_funds'::"text"])))
);


ALTER TABLE "public"."balance_requests" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_balance_requests"() RETURNS SETOF "public"."balance_requests"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT * FROM balance_requests ORDER BY created_at DESC;
END;
$$;


ALTER FUNCTION "public"."admin_get_balance_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_process_balance_request"("p_request_id" "uuid", "p_action" "text", "p_admin_notes" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_admin_id UUID;
  v_request RECORD;
BEGIN
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_admin_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'message', 'Accès refusé');
  END IF;
  
  SELECT * INTO v_request FROM balance_requests WHERE id = p_request_id AND status = 'pending';
  
  IF v_request IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Demande non trouvée');
  END IF;
  
  IF p_action = 'approve' THEN
    -- Approuver et créer la transaction
    UPDATE balance_requests SET status = 'approved', admin_notes = p_admin_notes, 
           processed_at = NOW(), processed_by = v_admin_id WHERE id = p_request_id;
    
    IF v_request.type = 'add_funds' THEN
      -- Pour les ajouts de fonds : montant complet
      INSERT INTO credit_transactions (user_id, type, amount, description, currency, status, payment_method) 
      VALUES (v_request.user_id, 'deposit', v_request.amount, 
              'Ajout de fonds approuvé par admin', 'MAD', 'completed', v_request.payment_method);
      
      -- Notifier l'utilisateur
      INSERT INTO notifications (user_id, title, message, type, action_type, read) 
      VALUES (v_request.user_id, 'Demande approuvée', 
              'Ajout de ' || v_request.amount || ' MAD approuvé et crédité',
              'success', 'payment', FALSE);
              
    ELSIF v_request.type = 'withdraw_funds' THEN
      -- Pour les retraits : appliquer commission de 20%
      DECLARE
        v_commission DECIMAL := v_request.amount * 0.20;
        v_net_amount DECIMAL := v_request.amount - v_commission;
      BEGIN
        -- Transaction de retrait (montant demandé)
        INSERT INTO credit_transactions (user_id, type, amount, description, currency, status, payment_method) 
        VALUES (v_request.user_id, 'withdrawal', v_request.amount, 
                'Retrait demandé (' || v_request.amount || ' MAD)', 'MAD', 'completed', v_request.payment_method);
        
        -- Transaction de commission (20% de frais de plateforme)
        INSERT INTO credit_transactions (user_id, type, amount, description, currency, status, payment_method) 
        VALUES (v_request.user_id, 'commission', v_commission, 
                'Frais de plateforme (20%) sur retrait de ' || v_request.amount || ' MAD', 'MAD', 'completed', 'platform');
        
        -- Notifier l'utilisateur avec détails de la commission
        INSERT INTO notifications (user_id, title, message, type, action_type, read) 
        VALUES (v_request.user_id, 'Retrait effectué', 
                'Retrait de ' || v_request.amount || ' MAD effectué. Montant net après frais de plateforme (20%): ' || v_net_amount || ' MAD',
                'success', 'payment', FALSE);
      END;
    END IF;
    
    UPDATE balance_requests SET status = 'completed' WHERE id = p_request_id;
    
    RETURN json_build_object('success', true, 'message', 'Approuvé');
    
  ELSIF p_action = 'reject' THEN
    UPDATE balance_requests SET status = 'rejected', admin_notes = p_admin_notes, 
           processed_at = NOW(), processed_by = v_admin_id WHERE id = p_request_id;
    
    INSERT INTO notifications (user_id, title, message, type, action_type, read) 
    VALUES (v_request.user_id, 'Demande rejetée', 
            'Votre demande de ' || v_request.amount || ' MAD a été rejetée' ||
            CASE WHEN p_admin_notes IS NOT NULL THEN '. Raison: ' || p_admin_notes ELSE '' END,
            'error', 'payment', FALSE);
    
    RETURN json_build_object('success', true, 'message', 'Rejeté');
  ELSE
    RETURN json_build_object('success', false, 'message', 'Action invalide');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."admin_process_balance_request"("p_request_id" "uuid", "p_action" "text", "p_admin_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_commission_to_transaction"("transaction_uuid" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  transaction_record RECORD;
  commission_calc JSONB;
  result JSONB;
BEGIN
  -- Récupérer la transaction
  SELECT * INTO transaction_record 
  FROM credit_transactions 
  WHERE id = transaction_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Transaction non trouvée'
    );
  END IF;
  
  -- Calculer la commission (seulement pour les achats de liens)
  IF transaction_record.type = 'purchase' AND transaction_record.amount > 0 THEN
    commission_calc := calculate_commission(ABS(transaction_record.amount));
    
    -- Mettre à jour la transaction avec les informations de commission
    UPDATE credit_transactions 
    SET 
      commission_amount = (commission_calc->>'commission_amount')::DECIMAL,
      net_amount = (commission_calc->>'net_amount')::DECIMAL,
      commission_rate = (commission_calc->>'commission_rate')::DECIMAL,
      updated_at = NOW()
    WHERE id = transaction_uuid;
    
    -- Enregistrer dans l'historique des commissions
    INSERT INTO commission_history (
      transaction_id,
      commission_amount,
      commission_rate,
      gross_amount,
      net_amount,
      description
    ) VALUES (
      transaction_uuid,
      (commission_calc->>'commission_amount')::DECIMAL,
      (commission_calc->>'commission_rate')::DECIMAL,
      (commission_calc->>'gross_amount')::DECIMAL,
      (commission_calc->>'net_amount')::DECIMAL,
      'Commission plateforme sur achat de lien'
    );
    
    result := jsonb_build_object(
      'success', true,
      'commission_applied', true,
      'commission_amount', commission_calc->>'commission_amount',
      'net_amount', commission_calc->>'net_amount'
    );
  ELSE
    -- Pas de commission pour les autres types de transactions
    UPDATE credit_transactions 
    SET 
      commission_amount = 0,
      net_amount = transaction_record.amount,
      commission_rate = 0,
      updated_at = NOW()
    WHERE id = transaction_uuid;
    
    result := jsonb_build_object(
      'success', true,
      'commission_applied', false,
      'reason', 'Type de transaction non éligible à la commission'
    );
  END IF;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."apply_commission_to_transaction"("transaction_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_confirm_expired_requests"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_count INTEGER := 0;
  v_request RECORD;
  v_transaction_id UUID;
BEGIN
  -- Traiter toutes les demandes expirées
  FOR v_request IN 
    SELECT * FROM link_purchase_requests 
    WHERE status = 'pending_confirmation' 
    AND confirmation_deadline < NOW()
  LOOP
    -- Traiter le paiement
    SELECT process_link_purchase(v_request.id, 'balance') INTO v_transaction_id;
    
    -- Mettre à jour le statut
    UPDATE link_purchase_requests 
    SET 
      status = 'auto_confirmed',
      auto_confirmed_at = NOW(),
      payment_transaction_id = v_transaction_id,
      updated_at = NOW()
    WHERE id = v_request.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."auto_confirm_expired_requests"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_confirm_expired_requests"() IS 'Confirme automatiquement les demandes expirées après 48h';



CREATE OR REPLACE FUNCTION "public"."calculate_commission"("gross_amount" numeric, "transaction_type" character varying DEFAULT 'link_purchase'::character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  config_record RECORD;
  commission_amount DECIMAL(10,2);
  net_amount DECIMAL(10,2);
  result JSONB;
BEGIN
  -- Récupérer la configuration de commission active
  SELECT * INTO config_record 
  FROM commission_config 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Configuration par défaut si aucune n'est trouvée
    commission_amount := 0;
    net_amount := gross_amount;
  ELSE
    -- Calculer la commission
    commission_amount := gross_amount * config_record.commission_rate;
    
    -- Appliquer les limites
    IF config_record.minimum_commission > 0 AND commission_amount < config_record.minimum_commission THEN
      commission_amount := config_record.minimum_commission;
    END IF;
    
    IF config_record.maximum_commission > 0 AND commission_amount > config_record.maximum_commission THEN
      commission_amount := config_record.maximum_commission;
    END IF;
    
    net_amount := gross_amount - commission_amount;
  END IF;
  
  result := jsonb_build_object(
    'commission_amount', commission_amount,
    'net_amount', net_amount,
    'commission_rate', COALESCE(config_record.commission_rate, 0),
    'gross_amount', gross_amount
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."calculate_commission"("gross_amount" numeric, "transaction_type" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_advertiser_balance"("advertiser_id" "uuid") RETURNS TABLE("balance" numeric, "user_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Vérifier que l'utilisateur actuel est un éditeur
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'publisher'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only publishers can check advertiser balance';
  END IF;

  -- Vérifier que l'annonceur existe et retourner son solde
  RETURN QUERY
  SELECT u.balance, u.id
  FROM users u
  WHERE u.id = advertiser_id
  AND u.role = 'advertiser';
END;
$$;


ALTER FUNCTION "public"."check_advertiser_balance"("advertiser_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_balance_before_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Récupérer le solde actuel
  SELECT balance INTO current_balance FROM users WHERE id = NEW.user_id;
  
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Utilisateur % non trouvé', NEW.user_id;
  END IF;
  
  NEW.balance_before := current_balance;
  
  -- Calculer le nouveau solde
  IF NEW.type IN ('deposit', 'refund') THEN
    NEW.balance_after := current_balance + NEW.amount;
  ELSIF NEW.type IN ('withdrawal', 'purchase', 'commission') THEN
    NEW.balance_after := current_balance - NEW.amount;
    IF NEW.balance_after < 0 THEN
      RAISE EXCEPTION 'Solde insuffisant: % - % = %', current_balance, NEW.amount, NEW.balance_after;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_balance_before_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_triggers_status"() RETURNS TABLE("trigger_name" "text", "table_name" "text", "function_name" "text", "is_active" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.trigger_name::TEXT,
    t.event_object_table::TEXT,
    t.action_statement::TEXT,
    CASE WHEN t.trigger_name IS NOT NULL THEN TRUE ELSE FALSE END
  FROM information_schema.triggers t
  WHERE t.event_object_table = 'credit_transactions'
    AND t.trigger_name LIKE '%balance%'
  ORDER BY t.trigger_name;
END;
$$;


ALTER FUNCTION "public"."check_triggers_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_notifications"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_email_history"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les emails plus anciens que 1 an
  DELETE FROM email_history 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_email_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_link_placement"("p_request_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_request RECORD;
  v_transaction_id UUID;
BEGIN
  -- Récupérer les détails de la demande
  SELECT * INTO v_request 
  FROM link_purchase_requests 
  WHERE id = p_request_id AND status = 'pending_confirmation';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà confirmée';
  END IF;
  
  -- Vérifier que le délai n'est pas dépassé
  IF v_request.confirmation_deadline < NOW() THEN
    RAISE EXCEPTION 'Délai de confirmation dépassé';
  END IF;
  
  -- Traiter le paiement
  SELECT process_link_purchase(p_request_id, 'balance') INTO v_transaction_id;
  
  -- Mettre à jour le statut
  UPDATE link_purchase_requests 
  SET 
    status = 'confirmed',
    confirmed_at = NOW(),
    payment_transaction_id = v_transaction_id,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."confirm_link_placement"("p_request_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."confirm_link_placement"("p_request_id" "uuid") IS 'Confirme le placement d''un lien par l''annonceur et traite le paiement';



CREATE OR REPLACE FUNCTION "public"."create_advanced_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" character varying DEFAULT 'info'::character varying, "p_priority" character varying DEFAULT 'normal'::character varying, "p_action_url" "text" DEFAULT NULL::"text", "p_action_type" character varying DEFAULT NULL::character varying, "p_action_data" "jsonb" DEFAULT '{}'::"jsonb", "p_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  notification_id UUID;
  user_preferences RECORD;
BEGIN
  -- Récupérer les préférences de l'utilisateur
  SELECT * INTO user_preferences 
  FROM notification_preferences 
  WHERE user_id = p_user_id;
  
  -- Créer la notification
  INSERT INTO notifications (
    user_id, title, message, type, priority, 
    action_url, action_type, action_data, expires_at
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_priority,
    p_action_url, p_action_type, p_action_data, p_expires_at
  ) RETURNING id INTO notification_id;
  
  -- Envoyer l'email si activé
  IF user_preferences.email_enabled AND p_priority IN ('high', 'urgent') THEN
    -- Ici on pourrait appeler une fonction pour envoyer l'email
    UPDATE notifications 
    SET email_sent = true, email_sent_at = NOW()
    WHERE id = notification_id;
  END IF;
  
  -- Envoyer la notification push si activée
  IF user_preferences.push_enabled THEN
    UPDATE notifications 
    SET push_sent = true, push_sent_at = NOW()
    WHERE id = notification_id;
  END IF;
  
  RETURN notification_id;
END;
$$;


ALTER FUNCTION "public"."create_advanced_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" character varying, "p_priority" character varying, "p_action_url" "text", "p_action_type" character varying, "p_action_data" "jsonb", "p_expires_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_conversation_on_acceptance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Si la demande est acceptée, créer une conversation
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO conversations (
      purchase_request_id,
      advertiser_id,
      publisher_id,
      subject
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.publisher_id,
      'Demande acceptée - ' || NEW.anchor_text
    );
    
    -- Ajouter un message système
    INSERT INTO conversation_messages (
      conversation_id,
      sender_id,
      receiver_id,
      content,
      message_type,
      related_purchase_request_id
    ) VALUES (
      (SELECT id FROM conversations WHERE purchase_request_id = NEW.id ORDER BY created_at DESC LIMIT 1),
      NEW.publisher_id,
      NEW.user_id,
      'Votre demande d''achat a été acceptée ! Le lien a été placé sur ' || COALESCE(NEW.placed_url, 'l''URL spécifiée') || '. Vous pouvez maintenant communiquer avec l''éditeur pour toute question.',
      'system',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_conversation_on_acceptance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_email_preferences"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_email_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_notification_preferences"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_notification_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_dispute"("p_purchase_request_id" "uuid", "p_initiator_id" "uuid", "p_dispute_type" character varying, "p_title" "text", "p_description" "text", "p_evidence_files" "text"[] DEFAULT '{}'::"text"[]) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  dispute_id UUID;
  purchase_request_record RECORD;
  respondent_id UUID;
BEGIN
  -- Récupérer les informations de la demande d'achat
  SELECT * INTO purchase_request_record
  FROM link_purchase_requests
  WHERE id = p_purchase_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande d''achat non trouvée';
  END IF;
  
  -- Déterminer le répondant (l'autre partie)
  IF p_initiator_id = purchase_request_record.user_id THEN
    respondent_id := purchase_request_record.publisher_id;
  ELSE
    respondent_id := purchase_request_record.user_id;
  END IF;
  
  -- Créer la dispute
  INSERT INTO disputes (
    purchase_request_id, campaign_id, initiator_id, respondent_id,
    dispute_type, title, description, evidence_files
  ) VALUES (
    p_purchase_request_id, purchase_request_record.campaign_id, 
    p_initiator_id, respondent_id, p_dispute_type, p_title, 
    p_description, p_evidence_files
  ) RETURNING id INTO dispute_id;
  
  -- Créer un message initial
  INSERT INTO dispute_messages (
    dispute_id, sender_id, message, message_type
  ) VALUES (
    dispute_id, p_initiator_id, p_description, 'comment'
  );
  
  -- Créer des notifications pour les parties impliquées
  PERFORM create_advanced_notification(
    respondent_id,
    'Nouvelle dispute ouverte',
    'Une dispute a été ouverte concernant votre demande d''achat de lien.',
    'warning',
    'high',
    '/dashboard/disputes/' || dispute_id,
    'dispute_opened',
    jsonb_build_object('dispute_id', dispute_id, 'dispute_type', p_dispute_type)
  );
  
  RETURN dispute_id;
END;
$$;


ALTER FUNCTION "public"."create_dispute"("p_purchase_request_id" "uuid", "p_initiator_id" "uuid", "p_dispute_type" character varying, "p_title" "text", "p_description" "text", "p_evidence_files" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text" DEFAULT 'info'::"text", "p_action_url" "text" DEFAULT NULL::"text", "p_action_type" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        action_url,
        action_type
    ) VALUES (
        p_user_id,
        p_title,
        p_message,
        p_type,
        p_action_url,
        p_action_type
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text", "p_action_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_blog_post_slug"("title" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convertir le titre en slug (minuscules, remplacer espaces et caractères spéciaux par des tirets)
    base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Vérifier l'unicité et ajouter un numéro si nécessaire
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$;


ALTER FUNCTION "public"."generate_blog_post_slug"("title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_campaign_complete_stats"("campaign_uuid" "uuid") RETURNS TABLE("total_requests" integer, "pending_requests" integer, "accepted_requests" integer, "rejected_requests" integer, "total_spent" numeric, "total_budget" numeric, "completion_rate" numeric, "average_price" numeric, "links_placed" integer, "active_links" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_requests,
    COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER as accepted_requests,
    COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER as rejected_requests,
    COALESCE(SUM(proposed_price) FILTER (WHERE status = 'accepted'), 0) as total_spent,
    (SELECT budget FROM campaigns WHERE id = campaign_uuid) as total_budget,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'accepted')::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0 
    END as completion_rate,
    CASE 
      WHEN COUNT(*) > 0 THEN AVG(proposed_price)
      ELSE 0 
    END as average_price,
    COUNT(*) FILTER (WHERE status = 'accepted' AND placed_url IS NOT NULL)::INTEGER as links_placed,
    COUNT(*) FILTER (WHERE status = 'accepted' AND placed_url IS NOT NULL)::INTEGER as active_links
  FROM link_purchase_requests 
  WHERE campaign_id = campaign_uuid;
END;
$$;


ALTER FUNCTION "public"."get_campaign_complete_stats"("campaign_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_campaign_stats"("campaign_uuid" "uuid") RETURNS TABLE("total_requests" integer, "pending_requests" integer, "approved_requests" integer, "rejected_requests" integer, "total_spent" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_requests,
    COUNT(*) FILTER (WHERE lpr.status = 'pending')::INTEGER as pending_requests,
    COUNT(*) FILTER (WHERE lpr.status = 'approved')::INTEGER as approved_requests,
    COUNT(*) FILTER (WHERE lpr.status = 'rejected')::INTEGER as rejected_requests,
    COALESCE(SUM(lpr.proposed_price) FILTER (WHERE lpr.status = 'approved'), 0) as total_spent
  FROM link_purchase_requests lpr
  WHERE lpr.campaign_id = campaign_uuid;
END;
$$;


ALTER FUNCTION "public"."get_campaign_stats"("campaign_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_commission_stats"("start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("total_commission" numeric, "total_transactions" integer, "average_commission" numeric, "commission_rate" numeric, "total_gross_amount" numeric, "total_net_amount" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ch.commission_amount), 0) as total_commission,
    COUNT(DISTINCT ch.transaction_id)::INTEGER as total_transactions,
    CASE 
      WHEN COUNT(DISTINCT ch.transaction_id) > 0 THEN 
        COALESCE(SUM(ch.commission_amount), 0) / COUNT(DISTINCT ch.transaction_id)
      ELSE 0 
    END as average_commission,
    CASE 
      WHEN SUM(ch.gross_amount) > 0 THEN 
        SUM(ch.commission_amount) / SUM(ch.gross_amount)
      ELSE 0 
    END as commission_rate,
    COALESCE(SUM(ch.gross_amount), 0) as total_gross_amount,
    COALESCE(SUM(ch.net_amount), 0) as total_net_amount
  FROM commission_history ch
  WHERE 
    (start_date IS NULL OR ch.created_at >= start_date)
    AND (end_date IS NULL OR ch.created_at <= end_date);
END;
$$;


ALTER FUNCTION "public"."get_commission_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dispute_stats"("user_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("total_disputes" integer, "open_disputes" integer, "resolved_disputes" integer, "escalated_disputes" integer, "total_refunds" numeric, "average_resolution_time_hours" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_disputes,
    COUNT(*) FILTER (WHERE status = 'open')::INTEGER as open_disputes,
    COUNT(*) FILTER (WHERE status = 'resolved')::INTEGER as resolved_disputes,
    COUNT(*) FILTER (WHERE status = 'escalated')::INTEGER as escalated_disputes,
    COALESCE(SUM(ar.refund_amount) FILTER (WHERE ar.status = 'completed'), 0) as total_refunds,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status = 'resolved') > 0 THEN
        AVG(EXTRACT(EPOCH FROM (resolved_at - opened_at)) / 3600) FILTER (WHERE status = 'resolved')
      ELSE 0 
    END as average_resolution_time_hours
  FROM disputes d
  LEFT JOIN automatic_refunds ar ON d.id = ar.dispute_id
  WHERE user_uuid IS NULL OR initiator_id = user_uuid OR respondent_id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."get_dispute_stats"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_email_stats"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("total_emails" bigint, "sent_emails" bigint, "failed_emails" bigint, "bounce_rate" numeric, "last_email_sent" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered') as sent_emails,
    COUNT(*) FILTER (WHERE status = 'failed' OR status = 'bounced') as failed_emails,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'bounced')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0 
    END as bounce_rate,
    MAX(sent_at) as last_email_sent
  FROM email_history
  WHERE (p_user_id IS NULL OR user_id = p_user_id);
END;
$$;


ALTER FUNCTION "public"."get_email_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_notification_stats"("user_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("total_notifications" integer, "unread_notifications" integer, "email_notifications" integer, "push_notifications" integer, "urgent_notifications" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_notifications,
    COUNT(*) FILTER (WHERE read = false)::INTEGER as unread_notifications,
    COUNT(*) FILTER (WHERE email_sent = true)::INTEGER as email_notifications,
    COUNT(*) FILTER (WHERE push_sent = true)::INTEGER as push_notifications,
    COUNT(*) FILTER (WHERE priority = 'urgent')::INTEGER as urgent_notifications
  FROM notifications 
  WHERE user_uuid IS NULL OR user_id = user_uuid;
END;
$$;


ALTER FUNCTION "public"."get_notification_stats"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_publisher_payment_info"() RETURNS TABLE("bank_account_info" "jsonb", "paypal_email" "text", "preferred_withdrawal_method" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    u.bank_account_info,
    u.paypal_email,
    u.preferred_withdrawal_method
  FROM users u
  WHERE u.id = v_user_id AND u.role = 'publisher';
END;
$$;


ALTER FUNCTION "public"."get_publisher_payment_info"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchase_request_details"("request_id" "uuid") RETURNS TABLE("id" "uuid", "link_listing_id" "uuid", "user_id" "uuid", "publisher_id" "uuid", "target_url" "text", "anchor_text" "text", "message" "text", "proposed_price" numeric, "proposed_duration" integer, "status" "text", "editor_response" "text", "response_date" timestamp with time zone, "placed_url" "text", "placed_at" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "advertiser_name" "text", "advertiser_email" "text", "advertiser_balance" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Vérifier que l'utilisateur actuel est impliqué dans cette demande
  IF NOT EXISTS (
    SELECT 1 FROM link_purchase_requests 
    WHERE id = request_id 
    AND (user_id = auth.uid() OR publisher_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: You can only access your own purchase requests';
  END IF;

  -- Retourner les détails de la demande avec les informations de l'annonceur
  RETURN QUERY
  SELECT 
    pr.id,
    pr.link_listing_id,
    pr.user_id,
    pr.publisher_id,
    pr.target_url,
    pr.anchor_text,
    pr.message,
    pr.proposed_price,
    pr.proposed_duration,
    pr.status,
    pr.editor_response,
    pr.response_date,
    pr.placed_url,
    pr.placed_at,
    pr.created_at,
    pr.updated_at,
    u.name as advertiser_name,
    u.email as advertiser_email,
    u.balance as advertiser_balance
  FROM link_purchase_requests pr
  JOIN users u ON pr.user_id = u.id
  WHERE pr.id = request_id;
END;
$$;


ALTER FUNCTION "public"."get_purchase_request_details"("request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM notifications
    WHERE user_id = p_user_id AND read = FALSE;
    
    RETURN count;
END;
$$;


ALTER FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_url_validation_stats"() RETURNS TABLE("total_links" integer, "validated_links" integer, "invalid_links" integer, "pending_validation" integer, "expired_links" integer, "validation_rate" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_links,
    COUNT(*) FILTER (WHERE url_validation_status = 'validated')::INTEGER as validated_links,
    COUNT(*) FILTER (WHERE url_validation_status = 'invalid')::INTEGER as invalid_links,
    COUNT(*) FILTER (WHERE url_validation_status = 'pending')::INTEGER as pending_validation,
    COUNT(*) FILTER (WHERE url_validation_status = 'expired')::INTEGER as expired_links,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE url_validation_status = 'validated')::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0 
    END as validation_rate
  FROM link_purchase_requests 
  WHERE status = 'accepted' AND placed_url IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."get_url_validation_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_conversations"("user_uuid" "uuid") RETURNS TABLE("conversation_id" "uuid", "purchase_request_id" "uuid", "other_user_id" "uuid", "subject" "text", "last_message_at" timestamp with time zone, "unread_count" integer, "anchor_text" "text", "target_url" "text", "purchase_status" "text", "last_message_content" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.purchase_request_id,
    CASE 
      WHEN c.advertiser_id = user_uuid THEN c.publisher_id
      ELSE c.advertiser_id
    END as other_user_id,
    c.subject,
    c.last_message_at,
    CASE 
      WHEN c.advertiser_id = user_uuid THEN c.unread_count_advertiser
      ELSE c.unread_count_publisher
    END as unread_count,
    lpr.anchor_text,
    lpr.target_url,
    lpr.status as purchase_status,
    (SELECT cm.content FROM conversation_messages cm
     WHERE cm.conversation_id = c.id 
     ORDER BY cm.created_at DESC 
     LIMIT 1) as last_message_content
  FROM conversations c
  JOIN link_purchase_requests lpr ON c.purchase_request_id = lpr.id
  WHERE c.advertiser_id = user_uuid OR c.publisher_id = user_uuid
  ORDER BY c.last_message_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_conversations"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_conversations_simple"("user_uuid" "uuid") RETURNS TABLE("conversation_id" "uuid", "subject" "text", "last_message_at" timestamp with time zone, "unread_count" integer, "other_user_id" "uuid", "last_message_content" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.subject,
    c.last_message_at,
    CASE 
      WHEN c.advertiser_id = user_uuid THEN c.unread_count_advertiser
      ELSE c.unread_count_publisher
    END as unread_count,
    CASE 
      WHEN c.advertiser_id = user_uuid THEN c.publisher_id
      ELSE c.advertiser_id
    END as other_user_id,
    (SELECT cm.content FROM conversation_messages cm
     WHERE cm.conversation_id = c.id 
     ORDER BY cm.created_at DESC 
     LIMIT 1) as last_message_content
  FROM conversations c
  WHERE c.advertiser_id = user_uuid OR c.publisher_id = user_uuid
  ORDER BY c.last_message_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_conversations_simple"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_journey_events"("p_user_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "event_type" character varying, "event_data" "jsonb", "event_timestamp" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uje.id,
    uje.event_type,
    uje.event_data,
    uje.event_timestamp
  FROM user_journey_events uje
  WHERE uje.user_id = p_user_id
  ORDER BY uje.event_timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_user_journey_events"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_email_sent"("p_user_id" "uuid", "p_email_type" character varying, "p_subject" character varying, "p_recipient_email" character varying, "p_template_name" character varying DEFAULT NULL::character varying, "p_status" character varying DEFAULT 'sent'::character varying, "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  email_id UUID;
BEGIN
  INSERT INTO email_history (
    user_id,
    email_type,
    subject,
    recipient_email,
    template_name,
    status,
    sent_at,
    metadata
  ) VALUES (
    p_user_id,
    p_email_type,
    p_subject,
    p_recipient_email,
    p_template_name,
    p_status,
    NOW(),
    p_metadata
  ) RETURNING id INTO email_id;
  
  RETURN email_id;
END;
$$;


ALTER FUNCTION "public"."log_email_sent"("p_user_id" "uuid", "p_email_type" character varying, "p_subject" character varying, "p_recipient_email" character varying, "p_template_name" character varying, "p_status" character varying, "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_messages_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Marquer les messages comme lus
  UPDATE conversation_messages 
  SET is_read = true, read_at = NOW()
  WHERE conversation_id = p_conversation_id 
    AND receiver_id = p_user_id 
    AND is_read = false;
  
  -- Réinitialiser le compteur de messages non lus
  IF p_user_id = (SELECT advertiser_id FROM conversations WHERE id = p_conversation_id) THEN
    UPDATE conversations 
    SET unread_count_advertiser = 0
    WHERE id = p_conversation_id;
  ELSE
    UPDATE conversations 
    SET unread_count_publisher = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."mark_messages_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_automatic_refunds"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  refund_record RECORD;
  processed_count INTEGER := 0;
  purchase_request_record RECORD;
BEGIN
  -- Traiter les remboursements en attente
  FOR refund_record IN 
    SELECT ar.*, d.initiator_id, d.respondent_id
    FROM automatic_refunds ar
    JOIN disputes d ON ar.dispute_id = d.id
    WHERE ar.status = 'pending'
  LOOP
    BEGIN
      -- Récupérer les informations de la demande d'achat
      SELECT * INTO purchase_request_record
      FROM link_purchase_requests
      WHERE id = (
        SELECT purchase_request_id 
        FROM disputes 
        WHERE id = refund_record.dispute_id
      );
      
      -- Créer la transaction de remboursement pour l'annonceur
      INSERT INTO credit_transactions (
        user_id, type, amount, description, related_purchase_request_id
      ) VALUES (
        purchase_request_record.user_id,
        'refund',
        refund_record.refund_amount,
        'Remboursement automatique - ' || refund_record.refund_reason,
        purchase_request_record.id
      );
      
      -- Créer la transaction de débit pour l'éditeur
      INSERT INTO credit_transactions (
        user_id, type, amount, description, related_purchase_request_id
      ) VALUES (
        purchase_request_record.publisher_id,
        'commission',
        -refund_record.refund_amount,
        'Remboursement automatique - ' || refund_record.refund_reason,
        purchase_request_record.id
      );
      
      -- Marquer le remboursement comme traité
      UPDATE automatic_refunds 
      SET 
        status = 'completed',
        processed_at = NOW()
      WHERE id = refund_record.id;
      
      processed_count := processed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- En cas d'erreur, marquer comme échoué
      UPDATE automatic_refunds 
      SET 
        status = 'failed',
        error_message = SQLERRM,
        processed_at = NOW()
      WHERE id = refund_record.id;
    END;
  END LOOP;
  
  RETURN processed_count;
END;
$$;


ALTER FUNCTION "public"."process_automatic_refunds"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_link_purchase"("p_purchase_request_id" "uuid", "p_advertiser_id" "uuid", "p_publisher_id" "uuid", "p_amount" numeric) RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_platform_fee DECIMAL(10,2);
  v_publisher_amount DECIMAL(10,2);
  v_transaction_id UUID;
  v_advertiser_balance DECIMAL(10,2);
  v_publisher_balance DECIMAL(10,2);
BEGIN
  -- Calculer les montants
  v_platform_fee := p_amount * 0.10; -- 10% de commission
  v_publisher_amount := p_amount - v_platform_fee;
  
  -- Vérifier le solde de l'annonceur
  SELECT balance INTO v_advertiser_balance FROM users WHERE id = p_advertiser_id;
  IF v_advertiser_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Solde insuffisant');
  END IF;
  
  -- Créer la transaction
  INSERT INTO link_purchase_transactions (
    purchase_request_id,
    advertiser_id,
    publisher_id,
    link_listing_id,
    amount,
    platform_fee,
    publisher_amount,
    status,
    completed_at
  ) VALUES (
    p_purchase_request_id,
    p_advertiser_id,
    p_publisher_id,
    (SELECT link_listing_id FROM link_purchase_requests WHERE id = p_purchase_request_id),
    p_amount,
    v_platform_fee,
    v_publisher_amount,
    'completed',
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Débiter l'annonceur
  UPDATE users SET balance = balance - p_amount WHERE id = p_advertiser_id;
  
  -- Créditer l'éditeur
  UPDATE users SET balance = balance + v_publisher_amount WHERE id = p_publisher_id;
  
  -- Mettre à jour le statut de la demande
  UPDATE link_purchase_requests SET status = 'accepted' WHERE id = p_purchase_request_id;
  
  -- Créer les transactions de crédit
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    related_transaction_id,
    related_link_listing_id,
    related_purchase_request_id,
    balance_before,
    balance_after
  ) VALUES 
  (p_advertiser_id, 'purchase', p_amount, 'Achat de lien', v_transaction_id, 
   (SELECT link_listing_id FROM link_purchase_requests WHERE id = p_purchase_request_id), 
   p_purchase_request_id, v_advertiser_balance, v_advertiser_balance - p_amount),
  (p_publisher_id, 'deposit', v_publisher_amount, 'Vente de lien', v_transaction_id,
   (SELECT link_listing_id FROM link_purchase_requests WHERE id = p_purchase_request_id),
   p_purchase_request_id, 
   (SELECT balance FROM users WHERE id = p_publisher_id) - v_publisher_amount,
   (SELECT balance FROM users WHERE id = p_publisher_id));
  
  RETURN json_build_object('success', true, 'transaction_id', v_transaction_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."process_link_purchase"("p_purchase_request_id" "uuid", "p_advertiser_id" "uuid", "p_publisher_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_add_funds"("p_amount" numeric, "p_payment_method" "text", "p_description" "text" DEFAULT NULL::"text", "p_payment_reference" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
  v_request_id UUID;
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Non authentifié');
  END IF;
  
  -- Récupérer les infos de l'utilisateur
  SELECT name, email INTO v_user_name, v_user_email FROM users WHERE id = v_user_id;
  
  INSERT INTO balance_requests (
    user_id, user_email, user_name, type, amount, payment_method, description, payment_reference, status
  ) VALUES (
    v_user_id, v_user_email, v_user_name, 'add_funds', p_amount, p_payment_method, p_description, p_payment_reference, 'pending'
  ) RETURNING id INTO v_request_id;
  
  -- Notifier l'admin
  INSERT INTO notifications (user_id, title, message, type, action_type, read) 
  SELECT u.id, 'Demande d''ajout de fonds', 
    'Nouvelle demande de ' || COALESCE(v_user_name, 'Utilisateur') || ' (' || p_amount || ' MAD)',
    'info', 'payment', FALSE
  FROM users u WHERE u.role = 'admin';
  
  RETURN json_build_object('success', true, 'request_id', v_request_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."request_add_funds"("p_amount" numeric, "p_payment_method" "text", "p_description" "text", "p_payment_reference" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_withdraw_funds"("p_amount" numeric, "p_payment_method" "text", "p_description" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
  v_user_balance DECIMAL;
  v_user_name TEXT;
  v_user_email TEXT;
  v_payment_info JSONB;
  v_request_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Non authentifié');
  END IF;
  
  -- Récupérer les infos de l'utilisateur et ses informations de paiement
  SELECT balance, name, email, 
         json_build_object(
           'bank_account_info', bank_account_info,
           'paypal_email', paypal_email,
           'preferred_withdrawal_method', preferred_withdrawal_method
         )
  INTO v_user_balance, v_user_name, v_user_email, v_payment_info
  FROM users 
  WHERE id = v_user_id;
  
  IF v_user_balance IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non trouvé');
  END IF;
  
  IF v_user_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', 'Solde insuffisant');
  END IF;
  
  INSERT INTO balance_requests (
    user_id, user_email, user_name, type, amount, payment_method, description, publisher_payment_info, status
  ) VALUES (
    v_user_id, v_user_email, v_user_name, 'withdraw_funds', p_amount, p_payment_method, p_description, v_payment_info, 'pending'
  ) RETURNING id INTO v_request_id;
  
  -- Notifier l'admin
  INSERT INTO notifications (user_id, title, message, type, action_type, read) 
  SELECT u.id, 'Demande de retrait', 
    'Nouvelle demande de retrait de ' || COALESCE(v_user_name, 'Utilisateur') || ' (' || p_amount || ' MAD)',
    'info', 'payment', FALSE
  FROM users u WHERE u.role = 'admin';
  
  RETURN json_build_object('success', true, 'request_id', v_request_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."request_withdraw_funds"("p_amount" numeric, "p_payment_method" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_dispute"("p_dispute_id" "uuid", "p_resolution_type" character varying, "p_resolution_amount" numeric DEFAULT NULL::numeric, "p_resolution_notes" "text" DEFAULT NULL::"text", "p_admin_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  dispute_record RECORD;
  refund_amount DECIMAL(10,2);
BEGIN
  -- Récupérer les informations de la dispute
  SELECT * INTO dispute_record
  FROM disputes
  WHERE id = p_dispute_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Mettre à jour la dispute
  UPDATE disputes 
  SET 
    status = 'resolved',
    resolution_type = p_resolution_type,
    resolution_amount = p_resolution_amount,
    resolution_notes = p_resolution_notes,
    assigned_admin_id = p_admin_id,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_dispute_id;
  
  -- Créer un remboursement automatique si nécessaire
  IF p_resolution_type IN ('refund_full', 'refund_partial') AND p_resolution_amount > 0 THEN
    -- Récupérer le montant de la transaction originale
    SELECT proposed_price INTO refund_amount
    FROM link_purchase_requests
    WHERE id = dispute_record.purchase_request_id;
    
    -- Ajuster le montant selon le type de remboursement
    IF p_resolution_type = 'refund_full' THEN
      refund_amount := refund_amount;
    ELSE
      refund_amount := LEAST(refund_amount, p_resolution_amount);
    END IF;
    
    -- Créer l'entrée de remboursement automatique
    INSERT INTO automatic_refunds (
      dispute_id, refund_amount, refund_reason, refund_type
    ) VALUES (
      p_dispute_id, refund_amount, 
      'Remboursement automatique - ' || p_resolution_type,
      'automatic'
    );
  END IF;
  
  -- Créer des notifications pour les parties
  PERFORM create_advanced_notification(
    dispute_record.initiator_id,
    'Dispute résolue',
    'Votre dispute a été résolue. Type: ' || p_resolution_type,
    'success',
    'normal',
    '/dashboard/disputes/' || p_dispute_id,
    'dispute_resolved',
    jsonb_build_object('dispute_id', p_dispute_id, 'resolution_type', p_resolution_type)
  );
  
  PERFORM create_advanced_notification(
    dispute_record.respondent_id,
    'Dispute résolue',
    'La dispute a été résolue. Type: ' || p_resolution_type,
    'success',
    'normal',
    '/dashboard/disputes/' || p_dispute_id,
    'dispute_resolved',
    jsonb_build_object('dispute_id', p_dispute_id, 'resolution_type', p_resolution_type)
  );
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."resolve_dispute"("p_dispute_id" "uuid", "p_resolution_type" character varying, "p_resolution_amount" numeric, "p_resolution_notes" "text", "p_admin_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_link_listings"("p_search" "text" DEFAULT NULL::"text", "p_category" "text"[] DEFAULT NULL::"text"[], "p_niche" "text"[] DEFAULT NULL::"text"[], "p_link_type" "text"[] DEFAULT NULL::"text"[], "p_link_position" "text"[] DEFAULT NULL::"text"[], "p_min_price" numeric DEFAULT NULL::numeric, "p_max_price" numeric DEFAULT NULL::numeric, "p_min_domain_authority" integer DEFAULT NULL::integer, "p_max_domain_authority" integer DEFAULT NULL::integer, "p_min_traffic" integer DEFAULT NULL::integer, "p_max_traffic" integer DEFAULT NULL::integer, "p_content_quality" "text"[] DEFAULT NULL::"text"[], "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "price" numeric, "currency" "text", "link_type" "text", "link_position" "text", "website_title" "text", "website_url" "text", "domain_authority" integer, "monthly_traffic" integer, "quality_score" numeric, "publisher_name" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lc.id,
        lc.title,
        lc.description,
        lc.price,
        lc.currency,
        lc.link_type,
        lc.position,
        lc.website_title,
        lc.website_url,
        lc.domain_authority,
        lc.monthly_traffic,
        lc.quality_score,
        lc.publisher_name,
        lc.created_at
    FROM link_catalog lc
    WHERE 
        (p_search IS NULL OR 
         to_tsvector('french', lc.title || ' ' || lc.description) @@ plainto_tsquery('french', p_search))
        AND (p_category IS NULL OR lc.website_category = ANY(p_category))
        AND (p_niche IS NULL OR lc.website_niche = ANY(p_niche))
        AND (p_link_type IS NULL OR lc.link_type = ANY(p_link_type))
        AND (p_link_position IS NULL OR lc.position = ANY(p_link_position))
        AND (p_min_price IS NULL OR lc.price >= p_min_price)
        AND (p_max_price IS NULL OR lc.price <= p_max_price)
        AND (p_min_domain_authority IS NULL OR lc.domain_authority >= p_min_domain_authority)
        AND (p_max_domain_authority IS NULL OR lc.domain_authority <= p_max_domain_authority)
        AND (p_min_traffic IS NULL OR lc.monthly_traffic >= p_min_traffic)
        AND (p_max_traffic IS NULL OR lc.monthly_traffic <= p_max_traffic)
        AND (p_content_quality IS NULL OR lc.content_quality = ANY(p_content_quality))
    ORDER BY lc.quality_score DESC, lc.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."search_link_listings"("p_search" "text", "p_category" "text"[], "p_niche" "text"[], "p_link_type" "text"[], "p_link_position" "text"[], "p_min_price" numeric, "p_max_price" numeric, "p_min_domain_authority" integer, "p_max_domain_authority" integer, "p_min_traffic" integer, "p_max_traffic" integer, "p_content_quality" "text"[], "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_notification_email"("p_notification_id" "uuid", "p_template_name" character varying, "p_variables" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  notification_record RECORD;
  user_record RECORD;
  template_record RECORD;
  email_id UUID;
BEGIN
  -- Récupérer les informations de la notification
  SELECT n.*, u.email as user_email, u.name as user_name
  INTO notification_record
  FROM notifications n
  JOIN users u ON n.user_id = u.id
  WHERE n.id = p_notification_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Récupérer le template
  SELECT * INTO template_record
  FROM email_templates
  WHERE name = p_template_name AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Créer l'entrée dans l'historique des emails
  INSERT INTO email_history (
    user_id, notification_id, email_type, subject, 
    recipient_email, template_name, status, metadata
  ) VALUES (
    notification_record.user_id, p_notification_id, p_template_name,
    template_record.subject, notification_record.user_email,
    p_template_name, 'pending', p_variables
  ) RETURNING id INTO email_id;
  
  -- Ici on pourrait intégrer avec un service d'email (SendGrid, Mailgun, etc.)
  -- Pour l'instant, on marque comme envoyé
  UPDATE email_history 
  SET status = 'sent', sent_at = NOW()
  WHERE id = email_id;
  
  UPDATE notifications 
  SET email_sent = true, email_sent_at = NOW()
  WHERE id = p_notification_id;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."send_notification_email"("p_notification_id" "uuid", "p_template_name" character varying, "p_variables" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_blog_post_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Si le slug est vide ou null, le générer à partir du titre
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_blog_post_slug(NEW.title);
    END IF;
    
    -- Si le statut est 'published' et published_at est null, le définir à maintenant
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
        NEW.published_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_blog_post_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_article_categories_on_website_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE link_listings 
  SET category = NEW.category
  WHERE website_id = NEW.id 
    AND category != NEW.category;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_article_categories_on_website_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_balance_triggers"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text" DEFAULT 'Test trigger'::"text") RETURNS TABLE("success" boolean, "old_balance" numeric, "new_balance" numeric, "transaction_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_old_balance DECIMAL;
  v_new_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- Récupérer le solde actuel
  SELECT balance INTO v_old_balance FROM users WHERE id = p_user_id;
  
  IF v_old_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 0::DECIMAL, NULL::UUID;
    RETURN;
  END IF;
  
  -- Insérer la transaction (les triggers vont se déclencher)
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    currency,
    status,
    created_at,
    completed_at
  ) VALUES (
    p_user_id,
    p_type,
    p_amount,
    p_description,
    'MAD',
    'completed',
    NOW(),
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Récupérer le nouveau solde
  SELECT balance INTO v_new_balance FROM users WHERE id = p_user_id;
  
  RETURN QUERY SELECT TRUE, v_old_balance, v_new_balance, v_transaction_id;
END;
$$;


ALTER FUNCTION "public"."test_balance_triggers"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_triggers_simple"("user_email" "text", "amount" numeric) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
  v_old_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- Récupérer l'utilisateur
  SELECT id, balance INTO v_user_id, v_old_balance 
  FROM users WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RETURN 'Utilisateur non trouvé: ' || user_email;
  END IF;
  
  -- Créer une transaction de test
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    description,
    currency,
    status
  ) VALUES (
    v_user_id,
    'deposit',
    amount,
    'Test triggers simple',
    'MAD',
    'completed'
  );
  
  -- Récupérer le nouveau solde
  SELECT balance INTO v_new_balance FROM users WHERE id = v_user_id;
  
  RETURN 'SUCCESS: ' || v_old_balance || ' -> ' || v_new_balance || ' MAD';
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR: ' || SQLERRM;
END;
$$;


ALTER FUNCTION "public"."test_triggers_simple"("user_email" "text", "amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_apply_commission"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Appliquer la commission après l'insertion d'une transaction
  IF NEW.type = 'purchase' THEN
    PERFORM apply_commission_to_transaction(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_apply_commission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_validate_url_on_placement"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Si une URL est ajoutée ou modifiée
  IF (NEW.placed_url IS NOT NULL AND NEW.placed_url != '') AND 
     (OLD.placed_url IS NULL OR OLD.placed_url != NEW.placed_url) THEN
    
    -- Déclencher la validation automatique
    PERFORM validate_placed_url(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_validate_url_on_placement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_blog_posts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_blog_posts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW(), 
      last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  
  -- Mettre à jour le compteur de messages non lus
  IF NEW.sender_id = (SELECT advertiser_id FROM conversations WHERE id = NEW.conversation_id) THEN
    UPDATE conversations 
    SET unread_count_publisher = unread_count_publisher + 1
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE conversations 
    SET unread_count_advertiser = unread_count_advertiser + 1
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_credit_transactions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_credit_transactions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_disputes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_disputes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notification_read_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.read = TRUE AND OLD.read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notification_read_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_placed_at_on_acceptance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Si le statut passe à 'accepted', définir placed_at automatiquement
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    NEW.placed_at = COALESCE(NEW.placed_at, NOW());
  END IF;
  
  -- Si le statut n'est plus 'accepted', effacer placed_at
  IF NEW.status != 'accepted' AND OLD.status = 'accepted' THEN
    NEW.placed_at = NULL;
    NEW.placed_url = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_placed_at_on_acceptance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_publisher_payment_info"("p_bank_account_info" "jsonb" DEFAULT NULL::"jsonb", "p_paypal_email" "text" DEFAULT NULL::"text", "p_preferred_method" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
BEGIN
  -- Récupérer l'utilisateur actuel
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Utilisateur non authentifié');
  END IF;
  
  -- Vérifier que c'est un éditeur
  SELECT role INTO v_user_role FROM users WHERE id = v_user_id;
  
  IF v_user_role != 'publisher' THEN
    RETURN json_build_object('success', false, 'message', 'Seuls les éditeurs peuvent modifier ces informations');
  END IF;
  
  -- Mettre à jour les informations
  UPDATE users 
  SET 
    bank_account_info = COALESCE(p_bank_account_info, bank_account_info),
    paypal_email = COALESCE(p_paypal_email, paypal_email),
    preferred_withdrawal_method = COALESCE(p_preferred_method, preferred_withdrawal_method),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN json_build_object('success', true, 'message', 'Informations de paiement mises à jour avec succès');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."update_publisher_payment_info"("p_bank_account_info" "jsonb", "p_paypal_email" "text", "p_preferred_method" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_success_stories_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_success_stories_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_balance_after_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Mettre à jour avec SECURITY DEFINER (contourne RLS)
  UPDATE users 
  SET balance = NEW.balance_after,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur % non trouvé pour mise à jour', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_balance_after_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_placed_url"("purchase_request_uuid" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  request_record RECORD;
  validation_result JSONB;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Récupérer les informations de la demande
  SELECT * INTO request_record 
  FROM link_purchase_requests 
  WHERE id = purchase_request_uuid;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Demande non trouvée'
    );
  END IF;
  
  -- Simuler une validation (dans un vrai système, on ferait un appel HTTP)
  -- Pour l'instant, on considère que l'URL est valide si elle existe
  IF request_record.placed_url IS NOT NULL AND request_record.placed_url != '' THEN
    -- Mettre à jour le statut de validation
    UPDATE link_purchase_requests 
    SET 
      url_validation_status = 'validated',
      url_validation_date = current_time,
      last_check_date = current_time,
      url_validation_notes = 'URL validée automatiquement'
    WHERE id = purchase_request_uuid;
    
    -- Enregistrer dans l'historique
    INSERT INTO url_validation_history (
      purchase_request_id,
      validation_status,
      response_code,
      is_accessible,
      has_target_link,
      anchor_text_found,
      notes
    ) VALUES (
      purchase_request_uuid,
      'validated',
      200,
      true,
      true,
      true,
      'Validation automatique réussie'
    );
    
    validation_result := jsonb_build_object(
      'success', true,
      'status', 'validated',
      'message', 'URL validée avec succès',
      'validation_date', current_time
    );
  ELSE
    -- URL invalide
    UPDATE link_purchase_requests 
    SET 
      url_validation_status = 'invalid',
      url_validation_date = current_time,
      last_check_date = current_time,
      url_validation_notes = 'URL manquante ou invalide'
    WHERE id = purchase_request_uuid;
    
    validation_result := jsonb_build_object(
      'success', false,
      'status', 'invalid',
      'message', 'URL manquante ou invalide'
    );
  END IF;
  
  RETURN validation_result;
END;
$$;


ALTER FUNCTION "public"."validate_placed_url"("purchase_request_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_url_placement"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Si une URL est placée, mettre à jour la date de validation
  IF NEW.placed_url IS NOT NULL AND OLD.placed_url IS NULL THEN
    NEW.url_validation_date = NOW();
  END IF;
  
  -- Si l'URL est supprimée, effacer la date de validation
  IF NEW.placed_url IS NULL AND OLD.placed_url IS NOT NULL THEN
    NEW.url_validation_date = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_url_placement"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automatic_refunds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dispute_id" "uuid",
    "transaction_id" "uuid",
    "refund_amount" numeric(10,2) NOT NULL,
    "refund_reason" character varying(100) NOT NULL,
    "refund_type" character varying(30) DEFAULT 'automatic'::character varying,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "processing_notes" "text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    CONSTRAINT "automatic_refunds_refund_type_check" CHECK ((("refund_type")::"text" = ANY ((ARRAY['automatic'::character varying, 'manual'::character varying, 'partial'::character varying])::"text"[]))),
    CONSTRAINT "automatic_refunds_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'processed'::character varying, 'completed'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."automatic_refunds" OWNER TO "postgres";


COMMENT ON TABLE "public"."automatic_refunds" IS 'Remboursements automatiques liés aux disputes';



CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "excerpt" "text",
    "content" "text" NOT NULL,
    "featured_image" character varying(500),
    "images" "text"[],
    "category" character varying(100),
    "tags" "text"[],
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "meta_title" character varying(255),
    "meta_description" "text",
    "author_id" "uuid",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "blog_posts_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commission_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "commission_rate" numeric(5,4) DEFAULT 0.10 NOT NULL,
    "minimum_commission" numeric(10,2) DEFAULT 0,
    "maximum_commission" numeric(10,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."commission_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."commission_config" IS 'Configuration des commissions de la plateforme';



CREATE TABLE IF NOT EXISTS "public"."commission_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_id" "uuid",
    "commission_amount" numeric(10,2) NOT NULL,
    "commission_rate" numeric(5,4) NOT NULL,
    "gross_amount" numeric(10,2) NOT NULL,
    "net_amount" numeric(10,2) NOT NULL,
    "commission_type" character varying(50) DEFAULT 'platform_fee'::character varying,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."commission_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."commission_history" IS 'Historique des commissions prélevées';



CREATE OR REPLACE VIEW "public"."commission_reports" AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "date",
    "count"(DISTINCT "transaction_id") AS "transactions_count",
    "sum"("commission_amount") AS "daily_commission",
    "sum"("gross_amount") AS "daily_gross_amount",
    "sum"("net_amount") AS "daily_net_amount",
    "avg"("commission_rate") AS "avg_commission_rate"
   FROM "public"."commission_history" "ch"
  GROUP BY ("date_trunc"('day'::"text", "created_at"))
  ORDER BY ("date_trunc"('day'::"text", "created_at")) DESC;


ALTER VIEW "public"."commission_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid",
    "sender_id" "uuid",
    "receiver_id" "uuid",
    "content" "text" NOT NULL,
    "message_type" character varying(20) DEFAULT 'text'::character varying,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "related_purchase_request_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "conversation_messages_message_type_check" CHECK ((("message_type")::"text" = ANY ((ARRAY['text'::character varying, 'system'::character varying, 'notification'::character varying, 'file'::character varying, 'link'::character varying])::"text"[])))
);


ALTER TABLE "public"."conversation_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation_messages" IS 'RLS désactivé temporairement pour résoudre les erreurs 403';



CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_request_id" "uuid",
    "advertiser_id" "uuid",
    "publisher_id" "uuid",
    "subject" character varying(255),
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "unread_count_advertiser" integer DEFAULT 0,
    "unread_count_publisher" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversations" IS 'RLS désactivé temporairement pour résoudre les erreurs 403';



CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" character varying(20) NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'MAD'::character varying,
    "status" character varying(20) DEFAULT 'completed'::character varying,
    "description" "text" NOT NULL,
    "related_transaction_id" "uuid",
    "related_link_listing_id" "uuid",
    "related_purchase_request_id" "uuid",
    "payment_method" character varying(20),
    "payment_reference" character varying(255),
    "balance_before" numeric(10,2) NOT NULL,
    "balance_after" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "commission_amount" numeric(10,2) DEFAULT 0,
    "net_amount" numeric(10,2) DEFAULT 0,
    "commission_rate" numeric(5,4) DEFAULT 0.10,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "credit_transactions_amount_check" CHECK (("amount" <> (0)::numeric)),
    CONSTRAINT "credit_transactions_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['bank_transfer'::character varying, 'paypal'::character varying, 'stripe'::character varying, 'manual'::character varying, 'platform'::character varying])::"text"[]))),
    CONSTRAINT "credit_transactions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying])::"text"[]))),
    CONSTRAINT "credit_transactions_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['deposit'::character varying, 'withdrawal'::character varying, 'purchase'::character varying, 'refund'::character varying, 'commission'::character varying])::"text"[]))),
    CONSTRAINT "valid_balance" CHECK (("balance_after" >= (0)::numeric))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."credit_transactions" IS 'RLS désactivé temporairement pour résoudre les erreurs 403';



COMMENT ON COLUMN "public"."credit_transactions"."commission_amount" IS 'Montant de la commission prélevée';



COMMENT ON COLUMN "public"."credit_transactions"."net_amount" IS 'Montant net après commission';



COMMENT ON COLUMN "public"."credit_transactions"."commission_rate" IS 'Taux de commission appliqué';



CREATE TABLE IF NOT EXISTS "public"."dispute_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dispute_id" "uuid",
    "sender_id" "uuid",
    "message" "text" NOT NULL,
    "message_type" character varying(20) DEFAULT 'comment'::character varying,
    "attachments" "text"[],
    "is_internal" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dispute_messages_message_type_check" CHECK ((("message_type")::"text" = ANY ((ARRAY['comment'::character varying, 'evidence'::character varying, 'resolution_proposal'::character varying, 'admin_decision'::character varying])::"text"[])))
);


ALTER TABLE "public"."dispute_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."dispute_messages" IS 'Messages échangés dans le cadre d''une dispute';



CREATE TABLE IF NOT EXISTS "public"."disputes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_request_id" "uuid",
    "campaign_id" "uuid",
    "initiator_id" "uuid",
    "respondent_id" "uuid",
    "dispute_type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "status" character varying(30) DEFAULT 'open'::character varying,
    "resolution_type" character varying(50),
    "resolution_amount" numeric(10,2),
    "resolution_notes" "text",
    "assigned_admin_id" "uuid",
    "admin_notes" "text",
    "opened_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "evidence_files" "text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "disputes_dispute_type_check" CHECK ((("dispute_type")::"text" = ANY ((ARRAY['link_not_placed'::character varying, 'link_removed'::character varying, 'wrong_url'::character varying, 'wrong_anchor_text'::character varying, 'poor_quality'::character varying, 'late_delivery'::character varying, 'non_compliance'::character varying, 'other'::character varying])::"text"[]))),
    CONSTRAINT "disputes_resolution_type_check" CHECK ((("resolution_type")::"text" = ANY ((ARRAY['refund_full'::character varying, 'refund_partial'::character varying, 'replacement'::character varying, 'compensation'::character varying, 'dismissed'::character varying])::"text"[]))),
    CONSTRAINT "disputes_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['open'::character varying, 'under_review'::character varying, 'resolved'::character varying, 'closed'::character varying, 'escalated'::character varying])::"text"[])))
);


ALTER TABLE "public"."disputes" OWNER TO "postgres";


COMMENT ON TABLE "public"."disputes" IS 'Système de disputes et réclamations';



COMMENT ON COLUMN "public"."disputes"."dispute_type" IS 'Type: link_not_placed, link_removed, wrong_url, etc.';



COMMENT ON COLUMN "public"."disputes"."status" IS 'Statut: open, under_review, resolved, closed, escalated';



COMMENT ON COLUMN "public"."disputes"."resolution_type" IS 'Type de résolution: refund_full, refund_partial, replacement, etc.';



CREATE TABLE IF NOT EXISTS "public"."link_purchase_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "link_listing_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "publisher_id" "uuid" NOT NULL,
    "target_url" "text" NOT NULL,
    "anchor_text" "text" NOT NULL,
    "message" "text",
    "proposed_price" numeric(10,2) NOT NULL,
    "proposed_duration" integer DEFAULT 1 NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "editor_response" "text",
    "response_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "placed_url" "text",
    "placed_at" timestamp with time zone,
    "url_validation_status" character varying(50) DEFAULT 'pending'::character varying,
    "url_validation_date" timestamp with time zone,
    "url_validation_notes" "text",
    "last_check_date" timestamp with time zone,
    "check_frequency_days" integer DEFAULT 30,
    "is_active" boolean DEFAULT true,
    "accepted_at" timestamp with time zone,
    "confirmation_deadline" timestamp with time zone,
    "confirmed_at" timestamp with time zone,
    "auto_confirmed_at" timestamp with time zone,
    "payment_transaction_id" "uuid",
    "custom_content" "text",
    "content_option" character varying(20) DEFAULT 'platform'::character varying,
    "article_content" "text",
    "article_title" "text",
    "article_keywords" "text"[],
    "writer_name" "text",
    "placement_url" "text",
    "placement_notes" "text",
    "extended_status" character varying(50),
    CONSTRAINT "link_purchase_requests_content_option_check" CHECK ((("content_option")::"text" = ANY ((ARRAY['platform'::character varying, 'custom'::character varying])::"text"[])))
);


ALTER TABLE "public"."link_purchase_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."link_purchase_requests" IS 'RLS désactivé temporairement pour résoudre les erreurs 403';



COMMENT ON COLUMN "public"."link_purchase_requests"."url_validation_status" IS 'Statut de validation: pending, validated, invalid, expired';



COMMENT ON COLUMN "public"."link_purchase_requests"."check_frequency_days" IS 'Fréquence de vérification en jours';



COMMENT ON COLUMN "public"."link_purchase_requests"."is_active" IS 'Indique si le lien est toujours actif';



COMMENT ON COLUMN "public"."link_purchase_requests"."custom_content" IS 'Contenu personnalisé fourni par l''annonceur (si content_option = custom)';



COMMENT ON COLUMN "public"."link_purchase_requests"."content_option" IS 'Option de contenu: platform (rédigé par la plateforme) ou custom (fourni par l''annonceur)';



COMMENT ON COLUMN "public"."link_purchase_requests"."article_content" IS 'Contenu de l''article rédigé par la plateforme';



COMMENT ON COLUMN "public"."link_purchase_requests"."article_title" IS 'Titre de l''article rédigé par la plateforme';



COMMENT ON COLUMN "public"."link_purchase_requests"."article_keywords" IS 'Mots-clés de l''article rédigé par la plateforme';



COMMENT ON COLUMN "public"."link_purchase_requests"."writer_name" IS 'Nom du rédacteur (admin) qui a rédigé l''article';



COMMENT ON COLUMN "public"."link_purchase_requests"."placement_url" IS 'URL de la page où le lien a été placé par l''éditeur';



COMMENT ON COLUMN "public"."link_purchase_requests"."placement_notes" IS 'Notes additionnelles sur le placement du lien';



COMMENT ON COLUMN "public"."link_purchase_requests"."extended_status" IS 'Statuts étendus: pending, accepted, accepted_waiting_article, article_ready, placement_pending, placement_completed, rejected, confirmed, cancelled';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "role" character varying(20) DEFAULT 'advertiser'::character varying,
    "phone" character varying(20),
    "website" character varying(255),
    "bio" "text",
    "company_name" character varying(255),
    "company_size" character varying(20),
    "location" character varying(255),
    "balance" numeric(10,2) DEFAULT 0,
    "credit_limit" numeric(10,2),
    "advertiser_info" "jsonb",
    "publisher_info" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bank_account_info" "jsonb" DEFAULT '{}'::"jsonb",
    "paypal_email" "text",
    "preferred_withdrawal_method" "text" DEFAULT 'bank_transfer'::"text",
    CONSTRAINT "users_company_size_check" CHECK ((("company_size")::"text" = ANY ((ARRAY['startup'::character varying, 'sme'::character varying, 'large'::character varying, 'agency'::character varying])::"text"[]))),
    CONSTRAINT "users_preferred_withdrawal_method_check" CHECK (("preferred_withdrawal_method" = ANY (ARRAY['bank_transfer'::"text", 'paypal'::"text"]))),
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['advertiser'::character varying, 'publisher'::character varying, 'admin'::character varying])::"text"[])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'RLS désactivé temporairement pour résoudre les erreurs 403';



COMMENT ON COLUMN "public"."users"."bank_account_info" IS 'Informations bancaires de l''éditeur (IBAN, RIB, nom de banque, etc.)';



COMMENT ON COLUMN "public"."users"."paypal_email" IS 'Email PayPal de l''éditeur pour les retraits';



COMMENT ON COLUMN "public"."users"."preferred_withdrawal_method" IS 'Méthode de retrait préférée de l''éditeur';



CREATE OR REPLACE VIEW "public"."disputes_needing_admin_attention" AS
 SELECT "d"."id",
    "d"."title",
    "d"."dispute_type",
    "d"."status",
    "d"."opened_at",
    "d"."initiator_id",
    "d"."respondent_id",
    "u1"."name" AS "initiator_name",
    "u2"."name" AS "respondent_name",
    "d"."purchase_request_id",
    "lpr"."proposed_price",
        CASE
            WHEN ((("d"."status")::"text" = 'open'::"text") AND ("d"."opened_at" < ("now"() - '48:00:00'::interval))) THEN 'high'::"text"
            WHEN ((("d"."status")::"text" = 'open'::"text") AND ("d"."opened_at" < ("now"() - '24:00:00'::interval))) THEN 'medium'::"text"
            ELSE 'low'::"text"
        END AS "priority"
   FROM ((("public"."disputes" "d"
     JOIN "public"."users" "u1" ON (("d"."initiator_id" = "u1"."id")))
     JOIN "public"."users" "u2" ON (("d"."respondent_id" = "u2"."id")))
     JOIN "public"."link_purchase_requests" "lpr" ON (("d"."purchase_request_id" = "lpr"."id")))
  WHERE (("d"."status")::"text" = ANY ((ARRAY['open'::character varying, 'under_review'::character varying])::"text"[]))
  ORDER BY
        CASE
            WHEN ((("d"."status")::"text" = 'open'::"text") AND ("d"."opened_at" < ("now"() - '48:00:00'::interval))) THEN 1
            WHEN ((("d"."status")::"text" = 'open'::"text") AND ("d"."opened_at" < ("now"() - '24:00:00'::interval))) THEN 2
            ELSE 3
        END, "d"."opened_at";


ALTER VIEW "public"."disputes_needing_admin_attention" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "notification_id" "uuid",
    "email_type" character varying(50) NOT NULL,
    "subject" character varying(255) NOT NULL,
    "recipient_email" character varying(255) NOT NULL,
    "template_name" character varying(100),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_history_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'sent'::character varying, 'delivered'::character varying, 'failed'::character varying, 'bounced'::character varying])::"text"[])))
);


ALTER TABLE "public"."email_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_history" IS 'Historique des emails envoyés via le système';



COMMENT ON COLUMN "public"."email_history"."status" IS 'Statut de l''email: pending, sent, delivered, failed, bounced';



CREATE TABLE IF NOT EXISTS "public"."email_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "preferences" "jsonb" DEFAULT '{"weekly_reports": true, "welcome_emails": true, "marketing_emails": false, "site_notifications": true, "order_notifications": true}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_preferences" IS 'Préférences email des utilisateurs pour les notifications';



COMMENT ON COLUMN "public"."email_preferences"."preferences" IS 'Préférences JSON pour les différents types d''emails';



CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "subject" character varying(255) NOT NULL,
    "html_content" "text" NOT NULL,
    "text_content" "text",
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_templates" IS 'Templates d''emails personnalisés';



CREATE TABLE IF NOT EXISTS "public"."link_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "website_id" "uuid",
    "user_id" "uuid",
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "target_url" "text" NOT NULL,
    "anchor_text" "text" NOT NULL,
    "link_type" character varying(20) NOT NULL,
    "position" character varying(20) NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'MAD'::character varying,
    "minimum_contract_duration" integer DEFAULT 1,
    "max_links_per_page" integer DEFAULT 1,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category" "text",
    CONSTRAINT "link_listings_currency_check" CHECK ((("currency")::"text" = ANY ((ARRAY['MAD'::character varying, 'EUR'::character varying, 'USD'::character varying])::"text"[]))),
    CONSTRAINT "link_listings_link_type_check" CHECK ((("link_type")::"text" = ANY ((ARRAY['dofollow'::character varying, 'nofollow'::character varying, 'sponsored'::character varying, 'ugc'::character varying])::"text"[]))),
    CONSTRAINT "link_listings_position_check" CHECK ((("position")::"text" = ANY ((ARRAY['header'::character varying, 'footer'::character varying, 'sidebar'::character varying, 'content'::character varying, 'menu'::character varying, 'popup'::character varying])::"text"[]))),
    CONSTRAINT "link_listings_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'sold'::character varying, 'pending'::character varying, 'inactive'::character varying])::"text"[])))
);


ALTER TABLE "public"."link_listings" OWNER TO "postgres";


COMMENT ON TABLE "public"."link_listings" IS 'RLS désactivé temporairement pour résoudre les erreurs 403';



COMMENT ON COLUMN "public"."link_listings"."title" IS 'Titre de l''annonce de lien';



COMMENT ON COLUMN "public"."link_listings"."description" IS 'Description de l''annonce de lien';



COMMENT ON COLUMN "public"."link_listings"."target_url" IS 'URL cible où le lien sera placé';



COMMENT ON COLUMN "public"."link_listings"."anchor_text" IS 'Texte d''ancrage souhaité';



COMMENT ON COLUMN "public"."link_listings"."link_type" IS 'Type de lien: dofollow, nofollow, sponsored, ugc';



COMMENT ON COLUMN "public"."link_listings"."position" IS 'Position du lien: header, footer, sidebar, content, menu, popup';



COMMENT ON COLUMN "public"."link_listings"."price" IS 'Prix en MAD';



COMMENT ON COLUMN "public"."link_listings"."currency" IS 'Devise: MAD, EUR, USD';



COMMENT ON COLUMN "public"."link_listings"."minimum_contract_duration" IS 'Durée minimale du contrat en mois';



COMMENT ON COLUMN "public"."link_listings"."max_links_per_page" IS 'Nombre maximum de liens par page';



COMMENT ON COLUMN "public"."link_listings"."status" IS 'Statut: active, sold, pending, inactive';



COMMENT ON COLUMN "public"."link_listings"."images" IS 'Images associées à l''annonce';



COMMENT ON COLUMN "public"."link_listings"."tags" IS 'Tags pour la recherche et le filtrage';



CREATE TABLE IF NOT EXISTS "public"."link_purchase_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_request_id" "uuid" NOT NULL,
    "advertiser_id" "uuid" NOT NULL,
    "publisher_id" "uuid" NOT NULL,
    "link_listing_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'MAD'::character varying,
    "platform_fee" numeric(10,2) NOT NULL,
    "publisher_amount" numeric(10,2) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "payment_method" character varying(20),
    "payment_reference" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "link_purchase_transactions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying])::"text"[])))
);


ALTER TABLE "public"."link_purchase_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."links_needing_validation" AS
 SELECT "lpr"."id",
    "lpr"."placed_url",
    "lpr"."anchor_text",
    "lpr"."url_validation_status",
    "lpr"."last_check_date",
    "lpr"."check_frequency_days",
    "lpr"."created_at",
    "u"."name" AS "advertiser_name",
    "p"."name" AS "publisher_name"
   FROM (("public"."link_purchase_requests" "lpr"
     JOIN "public"."users" "u" ON (("lpr"."user_id" = "u"."id")))
     JOIN "public"."users" "p" ON (("lpr"."publisher_id" = "p"."id")))
  WHERE ((("lpr"."status")::"text" = 'accepted'::"text") AND ("lpr"."placed_url" IS NOT NULL) AND ("lpr"."is_active" = true) AND ((("lpr"."url_validation_status")::"text" = 'pending'::"text") OR ("lpr"."last_check_date" IS NULL) OR (("lpr"."last_check_date" + (("lpr"."check_frequency_days" || ' days'::"text"))::interval) < "now"())));


ALTER VIEW "public"."links_needing_validation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email_enabled" boolean DEFAULT true,
    "push_enabled" boolean DEFAULT true,
    "sms_enabled" boolean DEFAULT false,
    "campaign_updates" boolean DEFAULT true,
    "payment_notifications" boolean DEFAULT true,
    "link_validation" boolean DEFAULT true,
    "commission_updates" boolean DEFAULT true,
    "system_alerts" boolean DEFAULT true,
    "frequency" character varying(20) DEFAULT 'immediate'::character varying,
    "quiet_hours_start" time without time zone DEFAULT '22:00:00'::time without time zone,
    "quiet_hours_end" time without time zone DEFAULT '08:00:00'::time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_preferences_frequency_check" CHECK ((("frequency")::"text" = ANY ((ARRAY['immediate'::character varying, 'hourly'::character varying, 'daily'::character varying, 'weekly'::character varying])::"text"[])))
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_preferences" IS 'Préférences de notification des utilisateurs';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "type" character varying(20) DEFAULT 'info'::character varying,
    "read" boolean DEFAULT false,
    "action_url" "text",
    "action_type" character varying(50),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    "email_sent" boolean DEFAULT false,
    "email_sent_at" timestamp with time zone,
    "push_sent" boolean DEFAULT false,
    "push_sent_at" timestamp with time zone,
    "priority" character varying(20) DEFAULT 'normal'::character varying,
    "expires_at" timestamp with time zone,
    "action_data" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "notifications_action_type_check" CHECK ((("action_type")::"text" = ANY ((ARRAY['link_purchase'::character varying, 'website_approval'::character varying, 'payment'::character varying, 'review'::character varying, 'campaign'::character varying, 'order'::character varying])::"text"[]))),
    CONSTRAINT "notifications_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[]))),
    CONSTRAINT "notifications_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['info'::character varying, 'success'::character varying, 'warning'::character varying, 'error'::character varying])::"text"[]))),
    CONSTRAINT "valid_notification" CHECK ((("length"(("title")::"text") > 0) AND ("length"("message") > 0)))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON COLUMN "public"."notifications"."priority" IS 'Priorité: low, normal, high, urgent';



COMMENT ON COLUMN "public"."notifications"."expires_at" IS 'Date d''expiration de la notification';



COMMENT ON COLUMN "public"."notifications"."action_data" IS 'Données supplémentaires pour l''action';



CREATE TABLE IF NOT EXISTS "public"."platform_settings" (
    "id" integer NOT NULL,
    "setting_key" character varying(100) NOT NULL,
    "setting_value" "text" NOT NULL,
    "setting_type" character varying(20) DEFAULT 'string'::character varying NOT NULL,
    "description" "text",
    "category" character varying(50) DEFAULT 'general'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."platform_settings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."platform_settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."platform_settings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."platform_settings_id_seq" OWNED BY "public"."platform_settings"."id";



CREATE TABLE IF NOT EXISTS "public"."service_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "admin_notes" "text",
    "client_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "placement_details" "text",
    "execution_notes" "text",
    "result_report" "text",
    "result_links" "jsonb" DEFAULT '[]'::"jsonb",
    "article_content" "text",
    "article_title" "text",
    "article_keywords" "text"[],
    "writer_name" "text",
    CONSTRAINT "service_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."service_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."service_requests" IS 'RLS désactivé temporairement pour résoudre les erreurs 403';



COMMENT ON COLUMN "public"."service_requests"."placement_details" IS 'Détails du placement fournis par le client';



COMMENT ON COLUMN "public"."service_requests"."execution_notes" IS 'Notes d''exécution par l''admin';



COMMENT ON COLUMN "public"."service_requests"."result_report" IS 'Rapport final avec liens créés';



COMMENT ON COLUMN "public"."service_requests"."result_links" IS 'Liens créés par la plateforme (JSON array)';



COMMENT ON COLUMN "public"."service_requests"."article_content" IS 'Contenu de l''article rédigé par la plateforme';



COMMENT ON COLUMN "public"."service_requests"."article_title" IS 'Titre de l''article rédigé par la plateforme';



COMMENT ON COLUMN "public"."service_requests"."article_keywords" IS 'Mots-clés ciblés dans l''article';



COMMENT ON COLUMN "public"."service_requests"."writer_name" IS 'Nom du rédacteur (admin qui a rédigé l''article)';



CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'MAD'::character varying,
    "minimum_quantity" integer DEFAULT 1,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "status" character varying(20) DEFAULT 'available'::character varying,
    "category" character varying(100) NOT NULL,
    "estimated_delivery_days" integer DEFAULT 7,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "services_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['available'::character varying, 'unavailable'::character varying])::"text"[])))
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."success_stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "excerpt" "text",
    "content" "text" NOT NULL,
    "featured_image" character varying(500),
    "images" "text"[],
    "category" character varying(100),
    "tags" "text"[],
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "meta_title" character varying(255),
    "meta_description" "text",
    "author_id" "uuid",
    "client_name" character varying(255),
    "client_website" character varying(500),
    "results_summary" "text",
    "metrics" "jsonb",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "success_stories_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."success_stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."url_validation_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_request_id" "uuid",
    "validation_date" timestamp with time zone DEFAULT "now"(),
    "validation_status" character varying(50) NOT NULL,
    "response_code" integer,
    "response_time_ms" integer,
    "content_length" integer,
    "is_accessible" boolean,
    "has_target_link" boolean,
    "anchor_text_found" boolean,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."url_validation_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."url_validation_history" IS 'Historique des validations d''URLs placées';



CREATE OR REPLACE VIEW "public"."user_conversations" AS
 SELECT "c"."id",
    "c"."purchase_request_id",
    "c"."advertiser_id",
    "c"."publisher_id",
    "c"."created_at",
    "c"."updated_at",
    "c"."subject",
    "c"."last_message_at",
    "c"."unread_count_advertiser",
    "c"."unread_count_publisher",
        CASE
            WHEN ("c"."advertiser_id" = "auth"."uid"()) THEN "c"."unread_count_advertiser"
            ELSE "c"."unread_count_publisher"
        END AS "unread_count",
        CASE
            WHEN ("c"."advertiser_id" = "auth"."uid"()) THEN "c"."publisher_id"
            ELSE "c"."advertiser_id"
        END AS "other_user_id",
    "lpr"."anchor_text",
    "lpr"."target_url",
    "lpr"."status" AS "purchase_status"
   FROM ("public"."conversations" "c"
     JOIN "public"."link_purchase_requests" "lpr" ON (("c"."purchase_request_id" = "lpr"."id")))
  WHERE (("c"."advertiser_id" = "auth"."uid"()) OR ("c"."publisher_id" = "auth"."uid"()));


ALTER VIEW "public"."user_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_journey_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" character varying(255) NOT NULL,
    "user_name" character varying(255),
    "user_role" character varying(20) NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "event_timestamp" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_journey_events_user_role_check" CHECK ((("user_role")::"text" = ANY ((ARRAY['advertiser'::character varying, 'publisher'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_journey_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_journey_events" IS 'Événements du parcours client pour l''analytics';



COMMENT ON COLUMN "public"."user_journey_events"."event_data" IS 'Données supplémentaires de l''événement au format JSON';



CREATE TABLE IF NOT EXISTS "public"."websites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "url" "text" NOT NULL,
    "category" character varying(50) NOT NULL,
    "metrics" "jsonb",
    "meta_title" character varying(255),
    "meta_description" "text",
    "slug" character varying(255) NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "available_link_spots" integer DEFAULT 0,
    "languages" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "new_article_price" integer DEFAULT 80,
    "is_new_article" boolean DEFAULT true,
    CONSTRAINT "websites_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['adults_only'::character varying, 'arts_entertainment'::character varying, 'auto_vehicles'::character varying, 'beauty_fashion_lifestyle'::character varying, 'business_consumer_services'::character varying, 'community_society'::character varying, 'computers_technology'::character varying, 'finance_economy'::character varying, 'food_drink'::character varying, 'gambling'::character varying, 'games'::character varying, 'health_wellness'::character varying, 'heavy_industry_engineering'::character varying, 'hobbies_leisure'::character varying, 'home_garden'::character varying, 'jobs_career'::character varying, 'law_government'::character varying, 'news_media'::character varying, 'pets_animals'::character varying, 'reference_education'::character varying, 'science_nature'::character varying, 'science_education'::character varying, 'shopping_deals'::character varying, 'sports_fitness'::character varying, 'travel_tourism'::character varying, 'various'::character varying, 'world_regional'::character varying])::"text"[]))),
    CONSTRAINT "websites_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending_approval'::character varying, 'suspended'::character varying])::"text"[])))
);


ALTER TABLE "public"."websites" OWNER TO "postgres";


COMMENT ON TABLE "public"."websites" IS 'RLS désactivé temporairement pour résoudre les erreurs 403';



COMMENT ON COLUMN "public"."websites"."title" IS 'Titre du site web';



COMMENT ON COLUMN "public"."websites"."description" IS 'Description du site web';



COMMENT ON COLUMN "public"."websites"."url" IS 'URL du site web';



COMMENT ON COLUMN "public"."websites"."category" IS 'Catégorie du site web';



COMMENT ON COLUMN "public"."websites"."metrics" IS 'Métriques SEO: monthly_traffic, domain_authority (Trust Flow), organic_keywords';



COMMENT ON COLUMN "public"."websites"."meta_title" IS 'Titre SEO du site web';



COMMENT ON COLUMN "public"."websites"."meta_description" IS 'Description SEO du site web';



COMMENT ON COLUMN "public"."websites"."slug" IS 'Slug URL du site web';



COMMENT ON COLUMN "public"."websites"."status" IS 'Statut: active, inactive, pending_approval, suspended';



COMMENT ON COLUMN "public"."websites"."available_link_spots" IS 'Nombre d''emplacements de liens disponibles';



COMMENT ON COLUMN "public"."websites"."languages" IS 'Langues supportées par le site';



COMMENT ON COLUMN "public"."websites"."new_article_price" IS 'Prix pour les nouveaux articles sur ce site (en MAD)';



COMMENT ON COLUMN "public"."websites"."is_new_article" IS 'Indique si ce site accepte les nouveaux articles';



ALTER TABLE ONLY "public"."platform_settings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."platform_settings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."automatic_refunds"
    ADD CONSTRAINT "automatic_refunds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."balance_requests"
    ADD CONSTRAINT "balance_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."commission_config"
    ADD CONSTRAINT "commission_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_history"
    ADD CONSTRAINT "commission_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dispute_messages"
    ADD CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_history"
    ADD CONSTRAINT "email_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_preferences"
    ADD CONSTRAINT "email_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_preferences"
    ADD CONSTRAINT "email_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."link_listings"
    ADD CONSTRAINT "link_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."link_purchase_requests"
    ADD CONSTRAINT "link_purchase_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."link_purchase_transactions"
    ADD CONSTRAINT "link_purchase_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."success_stories"
    ADD CONSTRAINT "success_stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."success_stories"
    ADD CONSTRAINT "success_stories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."url_validation_history"
    ADD CONSTRAINT "url_validation_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_journey_events"
    ADD CONSTRAINT "user_journey_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."websites"
    ADD CONSTRAINT "websites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."websites"
    ADD CONSTRAINT "websites_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_automatic_refunds_dispute_id" ON "public"."automatic_refunds" USING "btree" ("dispute_id");



CREATE INDEX "idx_automatic_refunds_status" ON "public"."automatic_refunds" USING "btree" ("status");



CREATE INDEX "idx_balance_requests_status" ON "public"."balance_requests" USING "btree" ("status");



CREATE INDEX "idx_balance_requests_user_id" ON "public"."balance_requests" USING "btree" ("user_id");



CREATE INDEX "idx_blog_posts_author_id" ON "public"."blog_posts" USING "btree" ("author_id");



CREATE INDEX "idx_blog_posts_category" ON "public"."blog_posts" USING "btree" ("category");



CREATE INDEX "idx_blog_posts_published_at" ON "public"."blog_posts" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_blog_posts_slug" ON "public"."blog_posts" USING "btree" ("slug");



CREATE INDEX "idx_blog_posts_status" ON "public"."blog_posts" USING "btree" ("status");



CREATE INDEX "idx_commission_config_active" ON "public"."commission_config" USING "btree" ("is_active");



CREATE INDEX "idx_commission_history_date" ON "public"."commission_history" USING "btree" ("created_at");



CREATE INDEX "idx_commission_history_transaction" ON "public"."commission_history" USING "btree" ("transaction_id");



CREATE INDEX "idx_conversation_messages_conversation_id" ON "public"."conversation_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_messages_created_at" ON "public"."conversation_messages" USING "btree" ("created_at");



CREATE INDEX "idx_conversation_messages_read" ON "public"."conversation_messages" USING "btree" ("is_read");



CREATE INDEX "idx_conversation_messages_receiver_id" ON "public"."conversation_messages" USING "btree" ("receiver_id");



CREATE INDEX "idx_conversation_messages_sender_id" ON "public"."conversation_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_conversations_active" ON "public"."conversations" USING "btree" ("is_active");



CREATE INDEX "idx_conversations_advertiser" ON "public"."conversations" USING "btree" ("advertiser_id");



CREATE INDEX "idx_conversations_last_message" ON "public"."conversations" USING "btree" ("last_message_at");



CREATE INDEX "idx_conversations_publisher" ON "public"."conversations" USING "btree" ("publisher_id");



CREATE INDEX "idx_conversations_purchase_request" ON "public"."conversations" USING "btree" ("purchase_request_id");



CREATE INDEX "idx_credit_transactions_commission" ON "public"."credit_transactions" USING "btree" ("commission_amount");



CREATE INDEX "idx_credit_transactions_created_at" ON "public"."credit_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_credit_transactions_status" ON "public"."credit_transactions" USING "btree" ("status");



CREATE INDEX "idx_credit_transactions_type" ON "public"."credit_transactions" USING "btree" ("type");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_dispute_messages_dispute_id" ON "public"."dispute_messages" USING "btree" ("dispute_id");



CREATE INDEX "idx_dispute_messages_sender_id" ON "public"."dispute_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_disputes_campaign" ON "public"."disputes" USING "btree" ("campaign_id");



CREATE INDEX "idx_disputes_initiator" ON "public"."disputes" USING "btree" ("initiator_id");



CREATE INDEX "idx_disputes_opened_at" ON "public"."disputes" USING "btree" ("opened_at");



CREATE INDEX "idx_disputes_purchase_request" ON "public"."disputes" USING "btree" ("purchase_request_id");



CREATE INDEX "idx_disputes_respondent" ON "public"."disputes" USING "btree" ("respondent_id");



CREATE INDEX "idx_disputes_status" ON "public"."disputes" USING "btree" ("status");



CREATE INDEX "idx_disputes_type" ON "public"."disputes" USING "btree" ("dispute_type");



CREATE INDEX "idx_email_history_email_type" ON "public"."email_history" USING "btree" ("email_type");



CREATE INDEX "idx_email_history_sent_at" ON "public"."email_history" USING "btree" ("sent_at");



CREATE INDEX "idx_email_history_status" ON "public"."email_history" USING "btree" ("status");



CREATE INDEX "idx_email_history_user_id" ON "public"."email_history" USING "btree" ("user_id");



CREATE INDEX "idx_email_preferences_user_id" ON "public"."email_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_link_listings_link_type" ON "public"."link_listings" USING "btree" ("link_type");



CREATE INDEX "idx_link_listings_price" ON "public"."link_listings" USING "btree" ("price");



CREATE INDEX "idx_link_listings_status" ON "public"."link_listings" USING "btree" ("status");



CREATE INDEX "idx_link_listings_user_id" ON "public"."link_listings" USING "btree" ("user_id");



CREATE INDEX "idx_link_listings_website_id" ON "public"."link_listings" USING "btree" ("website_id");



CREATE INDEX "idx_link_purchase_requests_accepted_with_url" ON "public"."link_purchase_requests" USING "btree" ("status", "placed_url") WHERE ((("status")::"text" = 'accepted'::"text") AND ("placed_url" IS NOT NULL));



CREATE INDEX "idx_link_purchase_requests_article_title" ON "public"."link_purchase_requests" USING "btree" ("article_title");



CREATE INDEX "idx_link_purchase_requests_confirmation_deadline" ON "public"."link_purchase_requests" USING "btree" ("confirmation_deadline") WHERE (("status")::"text" = 'pending_confirmation'::"text");



CREATE INDEX "idx_link_purchase_requests_content_option" ON "public"."link_purchase_requests" USING "btree" ("content_option");



CREATE INDEX "idx_link_purchase_requests_created_at" ON "public"."link_purchase_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_link_purchase_requests_extended_status" ON "public"."link_purchase_requests" USING "btree" ("extended_status");



CREATE INDEX "idx_link_purchase_requests_is_active" ON "public"."link_purchase_requests" USING "btree" ("is_active");



CREATE INDEX "idx_link_purchase_requests_link_listing_id" ON "public"."link_purchase_requests" USING "btree" ("link_listing_id");



CREATE INDEX "idx_link_purchase_requests_placed_url" ON "public"."link_purchase_requests" USING "btree" ("placed_url") WHERE ("placed_url" IS NOT NULL);



CREATE INDEX "idx_link_purchase_requests_publisher_id" ON "public"."link_purchase_requests" USING "btree" ("publisher_id");



CREATE INDEX "idx_link_purchase_requests_status" ON "public"."link_purchase_requests" USING "btree" ("status");



CREATE INDEX "idx_link_purchase_requests_user_id" ON "public"."link_purchase_requests" USING "btree" ("user_id");



CREATE INDEX "idx_link_purchase_requests_validation_status" ON "public"."link_purchase_requests" USING "btree" ("url_validation_status");



CREATE INDEX "idx_link_purchase_requests_writer_name" ON "public"."link_purchase_requests" USING "btree" ("writer_name");



CREATE INDEX "idx_link_purchase_transactions_advertiser_id" ON "public"."link_purchase_transactions" USING "btree" ("advertiser_id");



CREATE INDEX "idx_link_purchase_transactions_created_at" ON "public"."link_purchase_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_link_purchase_transactions_publisher_id" ON "public"."link_purchase_transactions" USING "btree" ("publisher_id");



CREATE INDEX "idx_link_purchase_transactions_purchase_request_id" ON "public"."link_purchase_transactions" USING "btree" ("purchase_request_id");



CREATE INDEX "idx_link_purchase_transactions_status" ON "public"."link_purchase_transactions" USING "btree" ("status");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_email_sent" ON "public"."notifications" USING "btree" ("email_sent");



CREATE INDEX "idx_notifications_expires_at" ON "public"."notifications" USING "btree" ("expires_at");



CREATE INDEX "idx_notifications_priority" ON "public"."notifications" USING "btree" ("priority");



CREATE INDEX "idx_notifications_push_sent" ON "public"."notifications" USING "btree" ("push_sent");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("read");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_service_requests_article_title" ON "public"."service_requests" USING "btree" ("article_title");



CREATE INDEX "idx_service_requests_service_id" ON "public"."service_requests" USING "btree" ("service_id");



CREATE INDEX "idx_service_requests_status" ON "public"."service_requests" USING "btree" ("status");



CREATE INDEX "idx_service_requests_user_id" ON "public"."service_requests" USING "btree" ("user_id");



CREATE INDEX "idx_service_requests_writer_name" ON "public"."service_requests" USING "btree" ("writer_name");



CREATE INDEX "idx_services_category" ON "public"."services" USING "btree" ("category");



CREATE INDEX "idx_services_status" ON "public"."services" USING "btree" ("status");



CREATE INDEX "idx_success_stories_author_id" ON "public"."success_stories" USING "btree" ("author_id");



CREATE INDEX "idx_success_stories_category" ON "public"."success_stories" USING "btree" ("category");



CREATE INDEX "idx_success_stories_client_name" ON "public"."success_stories" USING "btree" ("client_name");



CREATE INDEX "idx_success_stories_published_at" ON "public"."success_stories" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_success_stories_slug" ON "public"."success_stories" USING "btree" ("slug");



CREATE INDEX "idx_success_stories_status" ON "public"."success_stories" USING "btree" ("status");



CREATE INDEX "idx_url_validation_history_date" ON "public"."url_validation_history" USING "btree" ("validation_date");



CREATE INDEX "idx_url_validation_history_request_id" ON "public"."url_validation_history" USING "btree" ("purchase_request_id");



CREATE INDEX "idx_user_journey_events_event_type" ON "public"."user_journey_events" USING "btree" ("event_type");



CREATE INDEX "idx_user_journey_events_timestamp" ON "public"."user_journey_events" USING "btree" ("event_timestamp");



CREATE INDEX "idx_user_journey_events_user_id" ON "public"."user_journey_events" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_websites_category" ON "public"."websites" USING "btree" ("category");



CREATE INDEX "idx_websites_status" ON "public"."websites" USING "btree" ("status");



CREATE INDEX "idx_websites_user_id" ON "public"."websites" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trigger_apply_commission_on_transaction" AFTER INSERT ON "public"."credit_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_apply_commission"();



CREATE OR REPLACE TRIGGER "trigger_check_balance_before_transaction" BEFORE INSERT ON "public"."credit_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."check_balance_before_transaction"();



CREATE OR REPLACE TRIGGER "trigger_create_email_preferences" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_email_preferences"();



CREATE OR REPLACE TRIGGER "trigger_create_notification_preferences" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_notification_preferences"();



CREATE OR REPLACE TRIGGER "trigger_set_blog_post_slug" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_blog_post_slug"();



CREATE OR REPLACE TRIGGER "trigger_sync_article_categories" AFTER UPDATE OF "category" ON "public"."websites" FOR EACH ROW EXECUTE FUNCTION "public"."sync_article_categories_on_website_update"();



CREATE OR REPLACE TRIGGER "trigger_update_blog_posts_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_blog_posts_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_conversation_timestamp" AFTER INSERT ON "public"."conversation_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_credit_transactions_updated_at" BEFORE UPDATE ON "public"."credit_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_credit_transactions_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_disputes_updated_at" BEFORE UPDATE ON "public"."disputes" FOR EACH ROW EXECUTE FUNCTION "public"."update_disputes_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_notification_read_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_notification_read_at"();



CREATE OR REPLACE TRIGGER "trigger_update_success_stories_updated_at" BEFORE UPDATE ON "public"."success_stories" FOR EACH ROW EXECUTE FUNCTION "public"."update_success_stories_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_user_balance_after_transaction" AFTER INSERT ON "public"."credit_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_balance_after_transaction"();



CREATE OR REPLACE TRIGGER "update_link_listings_updated_at" BEFORE UPDATE ON "public"."link_listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_platform_settings_updated_at" BEFORE UPDATE ON "public"."platform_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_service_requests_updated_at" BEFORE UPDATE ON "public"."service_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_services_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_websites_updated_at" BEFORE UPDATE ON "public"."websites" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."automatic_refunds"
    ADD CONSTRAINT "automatic_refunds_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."automatic_refunds"
    ADD CONSTRAINT "automatic_refunds_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."credit_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."balance_requests"
    ADD CONSTRAINT "balance_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."balance_requests"
    ADD CONSTRAINT "balance_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."commission_history"
    ADD CONSTRAINT "commission_history_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."credit_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_related_purchase_request_id_fkey" FOREIGN KEY ("related_purchase_request_id") REFERENCES "public"."link_purchase_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversation_messages"
    ADD CONSTRAINT "conversation_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."link_purchase_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_related_link_listing_id_fkey" FOREIGN KEY ("related_link_listing_id") REFERENCES "public"."link_listings"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_related_purchase_request_id_fkey" FOREIGN KEY ("related_purchase_request_id") REFERENCES "public"."link_purchase_requests"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_related_transaction_id_fkey" FOREIGN KEY ("related_transaction_id") REFERENCES "public"."credit_transactions"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dispute_messages"
    ADD CONSTRAINT "dispute_messages_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dispute_messages"
    ADD CONSTRAINT "dispute_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."link_purchase_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_history"
    ADD CONSTRAINT "email_history_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_history"
    ADD CONSTRAINT "email_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_preferences"
    ADD CONSTRAINT "email_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_listings"
    ADD CONSTRAINT "link_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_listings"
    ADD CONSTRAINT "link_listings_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "public"."websites"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_purchase_requests"
    ADD CONSTRAINT "link_purchase_requests_link_listing_id_fkey" FOREIGN KEY ("link_listing_id") REFERENCES "public"."link_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_purchase_requests"
    ADD CONSTRAINT "link_purchase_requests_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."credit_transactions"("id");



ALTER TABLE ONLY "public"."link_purchase_requests"
    ADD CONSTRAINT "link_purchase_requests_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_purchase_requests"
    ADD CONSTRAINT "link_purchase_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_purchase_transactions"
    ADD CONSTRAINT "link_purchase_transactions_advertiser_id_fkey" FOREIGN KEY ("advertiser_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_purchase_transactions"
    ADD CONSTRAINT "link_purchase_transactions_link_listing_id_fkey" FOREIGN KEY ("link_listing_id") REFERENCES "public"."link_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_purchase_transactions"
    ADD CONSTRAINT "link_purchase_transactions_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_purchase_transactions"
    ADD CONSTRAINT "link_purchase_transactions_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."link_purchase_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_requests"
    ADD CONSTRAINT "service_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."success_stories"
    ADD CONSTRAINT "success_stories_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."url_validation_history"
    ADD CONSTRAINT "url_validation_history_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."link_purchase_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_journey_events"
    ADD CONSTRAINT "user_journey_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."websites"
    ADD CONSTRAINT "websites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can update all service requests" ON "public"."service_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view all credit transactions" ON "public"."credit_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view all purchase requests" ON "public"."link_purchase_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Admins can view all service requests" ON "public"."service_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Advertisers can create purchase requests" ON "public"."link_purchase_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Anyone can view active email templates" ON "public"."email_templates" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Authenticated users can insert link listings" ON "public"."link_listings" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can insert users" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can insert websites" ON "public"."websites" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable all operations for admins" ON "public"."services" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Les administrateurs peuvent modifier tous les articles" ON "public"."blog_posts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Les administrateurs peuvent supprimer tous les articles" ON "public"."blog_posts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Les administrateurs peuvent voir tous les articles" ON "public"."blog_posts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text")))));



CREATE POLICY "Les auteurs peuvent créer des articles" ON "public"."blog_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Les auteurs peuvent modifier leurs propres articles" ON "public"."blog_posts" FOR UPDATE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Les auteurs peuvent supprimer leurs propres articles" ON "public"."blog_posts" FOR DELETE USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Les auteurs peuvent voir leurs propres articles" ON "public"."blog_posts" FOR SELECT USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Les utilisateurs peuvent voir les articles publiés" ON "public"."blog_posts" FOR SELECT USING ((("status")::"text" = 'published'::"text"));



CREATE POLICY "Publishers can update their purchase requests" ON "public"."link_purchase_requests" FOR UPDATE USING (("auth"."uid"() = "publisher_id"));



CREATE POLICY "Services are viewable by everyone" ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "System can create transactions" ON "public"."link_purchase_transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can update transactions" ON "public"."link_purchase_transactions" FOR UPDATE USING (true);



CREATE POLICY "Users can create purchase requests" ON "public"."link_purchase_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own credit transactions" ON "public"."credit_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own service requests" ON "public"."service_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own credit transactions" ON "public"."credit_transactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert conversations" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK ((("advertiser_id" = "auth"."uid"()) OR ("publisher_id" = "auth"."uid"())));



CREATE POLICY "Users can insert messages in their conversations" ON "public"."conversation_messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = "auth"."uid"()) AND ("conversation_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE (("conversations"."advertiser_id" = "auth"."uid"()) OR ("conversations"."publisher_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert their own credit transactions" ON "public"."credit_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own email preferences" ON "public"."email_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own link listings" ON "public"."link_listings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own websites" ON "public"."websites" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own conversations" ON "public"."conversations" FOR UPDATE TO "authenticated" USING ((("advertiser_id" = "auth"."uid"()) OR ("publisher_id" = "auth"."uid"())));



CREATE POLICY "Users can update their own credit transactions" ON "public"."credit_transactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own email preferences" ON "public"."email_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own messages" ON "public"."conversation_messages" FOR UPDATE TO "authenticated" USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own purchase requests" ON "public"."link_purchase_requests" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "publisher_id")));



CREATE POLICY "Users can update their own service requests" ON "public"."service_requests" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view active link listings" ON "public"."link_listings" FOR SELECT USING ((("status")::"text" = 'active'::"text"));



CREATE POLICY "Users can view all active link listings" ON "public"."link_listings" FOR SELECT USING ((("status")::"text" = 'active'::"text"));



CREATE POLICY "Users can view all active websites" ON "public"."websites" FOR SELECT USING ((("status")::"text" = 'active'::"text"));



CREATE POLICY "Users can view approved websites" ON "public"."websites" FOR SELECT USING ((("status")::"text" = 'approved'::"text"));



CREATE POLICY "Users can view basic user info" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Users can view messages in their conversations" ON "public"."conversation_messages" FOR SELECT TO "authenticated" USING (("conversation_id" IN ( SELECT "conversations"."id"
   FROM "public"."conversations"
  WHERE (("conversations"."advertiser_id" = "auth"."uid"()) OR ("conversations"."publisher_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own conversations" ON "public"."conversations" FOR SELECT TO "authenticated" USING ((("advertiser_id" = "auth"."uid"()) OR ("publisher_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own credit transactions" ON "public"."credit_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own email history" ON "public"."email_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own email preferences" ON "public"."email_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own journey events" ON "public"."user_journey_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own link listings" ON "public"."link_listings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own purchase requests" ON "public"."link_purchase_requests" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "publisher_id")));



CREATE POLICY "Users can view their own service requests" ON "public"."service_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."link_purchase_transactions" FOR SELECT USING ((("auth"."uid"() = "advertiser_id") OR ("auth"."uid"() = "publisher_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text"))))));



CREATE POLICY "Users can view their own websites" ON "public"."websites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "allow_balance_updates" ON "public"."users" FOR UPDATE USING ((("auth"."uid"() = "id") OR ("auth"."role"() = 'authenticated'::"text")));



ALTER TABLE "public"."balance_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_posts_delete_policy" ON "public"."blog_posts" FOR DELETE USING ((("auth"."uid"() = "author_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text"))))));



CREATE POLICY "blog_posts_insert_policy" ON "public"."blog_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "blog_posts_select_policy" ON "public"."blog_posts" FOR SELECT USING (((("status")::"text" = 'published'::"text") OR ("auth"."uid"() = "author_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text"))))));



CREATE POLICY "blog_posts_update_policy" ON "public"."blog_posts" FOR UPDATE USING ((("auth"."uid"() = "author_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text"))))));



ALTER TABLE "public"."email_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."link_purchase_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."success_stories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "success_stories_delete_policy" ON "public"."success_stories" FOR DELETE USING ((("auth"."uid"() = "author_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text"))))));



CREATE POLICY "success_stories_insert_policy" ON "public"."success_stories" FOR INSERT WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "success_stories_select_policy" ON "public"."success_stories" FOR SELECT USING (((("status")::"text" = 'published'::"text") OR ("auth"."uid"() = "author_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text"))))));



CREATE POLICY "success_stories_update_policy" ON "public"."success_stories" FOR UPDATE USING ((("auth"."uid"() = "author_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text"))))));



ALTER TABLE "public"."user_journey_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_balance_requests" ON "public"."balance_requests" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."role")::"text" = 'admin'::"text"))))));



CREATE POLICY "users_update_own_payment_info" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."accept_purchase_request"("p_request_id" "uuid", "p_placed_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_purchase_request"("p_request_id" "uuid", "p_placed_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_purchase_request"("p_request_id" "uuid", "p_placed_url" "text") TO "service_role";



GRANT ALL ON TABLE "public"."balance_requests" TO "anon";
GRANT ALL ON TABLE "public"."balance_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."balance_requests" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_balance_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_balance_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_balance_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_process_balance_request"("p_request_id" "uuid", "p_action" "text", "p_admin_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_process_balance_request"("p_request_id" "uuid", "p_action" "text", "p_admin_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_process_balance_request"("p_request_id" "uuid", "p_action" "text", "p_admin_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_commission_to_transaction"("transaction_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_commission_to_transaction"("transaction_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_commission_to_transaction"("transaction_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_confirm_expired_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_confirm_expired_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_confirm_expired_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_commission"("gross_amount" numeric, "transaction_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_commission"("gross_amount" numeric, "transaction_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_commission"("gross_amount" numeric, "transaction_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_advertiser_balance"("advertiser_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_advertiser_balance"("advertiser_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_advertiser_balance"("advertiser_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_balance_before_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_balance_before_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_balance_before_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_triggers_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_triggers_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_triggers_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_email_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_email_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_email_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."confirm_link_placement"("p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_link_placement"("p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_link_placement"("p_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_advanced_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" character varying, "p_priority" character varying, "p_action_url" "text", "p_action_type" character varying, "p_action_data" "jsonb", "p_expires_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."create_advanced_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" character varying, "p_priority" character varying, "p_action_url" "text", "p_action_type" character varying, "p_action_data" "jsonb", "p_expires_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_advanced_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" character varying, "p_priority" character varying, "p_action_url" "text", "p_action_type" character varying, "p_action_data" "jsonb", "p_expires_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_conversation_on_acceptance"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_conversation_on_acceptance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_conversation_on_acceptance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_email_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_email_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_email_preferences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_notification_preferences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_dispute"("p_purchase_request_id" "uuid", "p_initiator_id" "uuid", "p_dispute_type" character varying, "p_title" "text", "p_description" "text", "p_evidence_files" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_dispute"("p_purchase_request_id" "uuid", "p_initiator_id" "uuid", "p_dispute_type" character varying, "p_title" "text", "p_description" "text", "p_evidence_files" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_dispute"("p_purchase_request_id" "uuid", "p_initiator_id" "uuid", "p_dispute_type" character varying, "p_title" "text", "p_description" "text", "p_evidence_files" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text", "p_action_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text", "p_action_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_title" "text", "p_message" "text", "p_type" "text", "p_action_url" "text", "p_action_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_blog_post_slug"("title" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_blog_post_slug"("title" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_blog_post_slug"("title" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_campaign_complete_stats"("campaign_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_campaign_complete_stats"("campaign_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_campaign_complete_stats"("campaign_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_campaign_stats"("campaign_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_campaign_stats"("campaign_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_campaign_stats"("campaign_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_commission_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_commission_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_commission_stats"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dispute_stats"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dispute_stats"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dispute_stats"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_email_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_email_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_email_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_notification_stats"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_notification_stats"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_notification_stats"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_publisher_payment_info"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_publisher_payment_info"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_publisher_payment_info"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchase_request_details"("request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchase_request_details"("request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchase_request_details"("request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_url_validation_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_url_validation_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_url_validation_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations_simple"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations_simple"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations_simple"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_journey_events"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_journey_events"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_journey_events"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_email_sent"("p_user_id" "uuid", "p_email_type" character varying, "p_subject" character varying, "p_recipient_email" character varying, "p_template_name" character varying, "p_status" character varying, "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_email_sent"("p_user_id" "uuid", "p_email_type" character varying, "p_subject" character varying, "p_recipient_email" character varying, "p_template_name" character varying, "p_status" character varying, "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_email_sent"("p_user_id" "uuid", "p_email_type" character varying, "p_subject" character varying, "p_recipient_email" character varying, "p_template_name" character varying, "p_status" character varying, "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_messages_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_automatic_refunds"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_automatic_refunds"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_automatic_refunds"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_link_purchase"("p_purchase_request_id" "uuid", "p_advertiser_id" "uuid", "p_publisher_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."process_link_purchase"("p_purchase_request_id" "uuid", "p_advertiser_id" "uuid", "p_publisher_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_link_purchase"("p_purchase_request_id" "uuid", "p_advertiser_id" "uuid", "p_publisher_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."request_add_funds"("p_amount" numeric, "p_payment_method" "text", "p_description" "text", "p_payment_reference" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."request_add_funds"("p_amount" numeric, "p_payment_method" "text", "p_description" "text", "p_payment_reference" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_add_funds"("p_amount" numeric, "p_payment_method" "text", "p_description" "text", "p_payment_reference" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_withdraw_funds"("p_amount" numeric, "p_payment_method" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."request_withdraw_funds"("p_amount" numeric, "p_payment_method" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_withdraw_funds"("p_amount" numeric, "p_payment_method" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_dispute"("p_dispute_id" "uuid", "p_resolution_type" character varying, "p_resolution_amount" numeric, "p_resolution_notes" "text", "p_admin_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_dispute"("p_dispute_id" "uuid", "p_resolution_type" character varying, "p_resolution_amount" numeric, "p_resolution_notes" "text", "p_admin_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_dispute"("p_dispute_id" "uuid", "p_resolution_type" character varying, "p_resolution_amount" numeric, "p_resolution_notes" "text", "p_admin_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_link_listings"("p_search" "text", "p_category" "text"[], "p_niche" "text"[], "p_link_type" "text"[], "p_link_position" "text"[], "p_min_price" numeric, "p_max_price" numeric, "p_min_domain_authority" integer, "p_max_domain_authority" integer, "p_min_traffic" integer, "p_max_traffic" integer, "p_content_quality" "text"[], "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_link_listings"("p_search" "text", "p_category" "text"[], "p_niche" "text"[], "p_link_type" "text"[], "p_link_position" "text"[], "p_min_price" numeric, "p_max_price" numeric, "p_min_domain_authority" integer, "p_max_domain_authority" integer, "p_min_traffic" integer, "p_max_traffic" integer, "p_content_quality" "text"[], "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_link_listings"("p_search" "text", "p_category" "text"[], "p_niche" "text"[], "p_link_type" "text"[], "p_link_position" "text"[], "p_min_price" numeric, "p_max_price" numeric, "p_min_domain_authority" integer, "p_max_domain_authority" integer, "p_min_traffic" integer, "p_max_traffic" integer, "p_content_quality" "text"[], "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."send_notification_email"("p_notification_id" "uuid", "p_template_name" character varying, "p_variables" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."send_notification_email"("p_notification_id" "uuid", "p_template_name" character varying, "p_variables" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_notification_email"("p_notification_id" "uuid", "p_template_name" character varying, "p_variables" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_blog_post_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_blog_post_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_blog_post_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_article_categories_on_website_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_article_categories_on_website_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_article_categories_on_website_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_balance_triggers"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."test_balance_triggers"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_balance_triggers"("p_user_id" "uuid", "p_type" "text", "p_amount" numeric, "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."test_triggers_simple"("user_email" "text", "amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."test_triggers_simple"("user_email" "text", "amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_triggers_simple"("user_email" "text", "amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_apply_commission"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_apply_commission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_apply_commission"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_validate_url_on_placement"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_validate_url_on_placement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_validate_url_on_placement"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_blog_posts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_blog_posts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_blog_posts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_credit_transactions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_credit_transactions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_credit_transactions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_disputes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_disputes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_disputes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notification_read_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notification_read_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notification_read_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_placed_at_on_acceptance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_placed_at_on_acceptance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_placed_at_on_acceptance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_publisher_payment_info"("p_bank_account_info" "jsonb", "p_paypal_email" "text", "p_preferred_method" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_publisher_payment_info"("p_bank_account_info" "jsonb", "p_paypal_email" "text", "p_preferred_method" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_publisher_payment_info"("p_bank_account_info" "jsonb", "p_paypal_email" "text", "p_preferred_method" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_success_stories_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_success_stories_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_success_stories_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_balance_after_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_balance_after_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_balance_after_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_placed_url"("purchase_request_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_placed_url"("purchase_request_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_placed_url"("purchase_request_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_url_placement"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_url_placement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_url_placement"() TO "service_role";


















GRANT ALL ON TABLE "public"."automatic_refunds" TO "anon";
GRANT ALL ON TABLE "public"."automatic_refunds" TO "authenticated";
GRANT ALL ON TABLE "public"."automatic_refunds" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."commission_config" TO "anon";
GRANT ALL ON TABLE "public"."commission_config" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_config" TO "service_role";



GRANT ALL ON TABLE "public"."commission_history" TO "anon";
GRANT ALL ON TABLE "public"."commission_history" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_history" TO "service_role";



GRANT ALL ON TABLE "public"."commission_reports" TO "anon";
GRANT ALL ON TABLE "public"."commission_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_reports" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_messages" TO "anon";
GRANT ALL ON TABLE "public"."conversation_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_messages" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."dispute_messages" TO "anon";
GRANT ALL ON TABLE "public"."dispute_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."dispute_messages" TO "service_role";



GRANT ALL ON TABLE "public"."disputes" TO "anon";
GRANT ALL ON TABLE "public"."disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."disputes" TO "service_role";



GRANT ALL ON TABLE "public"."link_purchase_requests" TO "anon";
GRANT ALL ON TABLE "public"."link_purchase_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."link_purchase_requests" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."disputes_needing_admin_attention" TO "anon";
GRANT ALL ON TABLE "public"."disputes_needing_admin_attention" TO "authenticated";
GRANT ALL ON TABLE "public"."disputes_needing_admin_attention" TO "service_role";



GRANT ALL ON TABLE "public"."email_history" TO "anon";
GRANT ALL ON TABLE "public"."email_history" TO "authenticated";
GRANT ALL ON TABLE "public"."email_history" TO "service_role";



GRANT ALL ON TABLE "public"."email_preferences" TO "anon";
GRANT ALL ON TABLE "public"."email_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."email_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."email_templates" TO "anon";
GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_templates" TO "service_role";



GRANT ALL ON TABLE "public"."link_listings" TO "anon";
GRANT ALL ON TABLE "public"."link_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."link_listings" TO "service_role";



GRANT ALL ON TABLE "public"."link_purchase_transactions" TO "anon";
GRANT ALL ON TABLE "public"."link_purchase_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."link_purchase_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."links_needing_validation" TO "anon";
GRANT ALL ON TABLE "public"."links_needing_validation" TO "authenticated";
GRANT ALL ON TABLE "public"."links_needing_validation" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."platform_settings" TO "anon";
GRANT ALL ON TABLE "public"."platform_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."platform_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."platform_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."platform_settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."service_requests" TO "anon";
GRANT ALL ON TABLE "public"."service_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."service_requests" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."success_stories" TO "anon";
GRANT ALL ON TABLE "public"."success_stories" TO "authenticated";
GRANT ALL ON TABLE "public"."success_stories" TO "service_role";



GRANT ALL ON TABLE "public"."url_validation_history" TO "anon";
GRANT ALL ON TABLE "public"."url_validation_history" TO "authenticated";
GRANT ALL ON TABLE "public"."url_validation_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_conversations" TO "anon";
GRANT ALL ON TABLE "public"."user_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."user_journey_events" TO "anon";
GRANT ALL ON TABLE "public"."user_journey_events" TO "authenticated";
GRANT ALL ON TABLE "public"."user_journey_events" TO "service_role";



GRANT ALL ON TABLE "public"."websites" TO "anon";
GRANT ALL ON TABLE "public"."websites" TO "authenticated";
GRANT ALL ON TABLE "public"."websites" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
