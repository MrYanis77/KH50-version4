import { directus } from "@/integration/directus";
import { createItem, readUsers } from "@directus/sdk";
import type { NotificationType } from "@/integration/directus-types";
import { STATUT_ID } from "@/integration/directus-types";
import type {
  VictimeRow,
  FragmentRow,
  ParcoursRow,
  RecueilRow,
  RelationFamilialeRow,
  SepultureRow,
} from "@/integration/directus-types";

function relId(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "object" && val !== null && "id" in val) return Number((val as { id: number }).id);
  return Number(val);
}

/** Données locales admin pour retrouver l’auteur à notifier après changement de statut. */
export type ModerationNotificationContext = {
  victimes: VictimeRow[];
  fragments: FragmentRow[];
  parcours: ParcoursRow[];
  recueil?: RecueilRow[];
  relations?: RelationFamilialeRow[];
  sepultures?: SepultureRow[];
};

/**
 * Envoie une notification au contributeur lorsque son contenu passe en « avéré » ou « non fiable ».
 * Utilisé depuis l’admin (tous les chemins de mise à jour de statut).
 */
export async function notifyContributorOnStatutChange(
  collection: string,
  itemId: number,
  newStatutId: number,
  ctx: ModerationNotificationContext
): Promise<void> {
  if (newStatutId !== STATUT_ID.VERIFIE && newStatutId !== STATUT_ID.NON_FIABLE) return;

  const type = newStatutId === STATUT_ID.VERIFIE ? "validation" : "rejet";
  let auteurUserId: string | null = null;
  let itemLabel = "";

  switch (collection) {
    case "mmrl_victimes": {
      const v = ctx.victimes.find((x) => x.id === itemId);
      if (v?.auteur_user_id) {
        auteurUserId = v.auteur_user_id;
        itemLabel = `${v.prenom} ${v.nom}`;
      }
      break;
    }
    case "mmrl_fragments": {
      const f = ctx.fragments.find((x) => x.id === itemId);
      if (f?.auteur_user_id) {
        auteurUserId = f.auteur_user_id;
        const desc = f.description?.trim() || "";
        itemLabel =
          f.titre?.trim() ||
          (desc ? (desc.length > 80 ? `${desc.slice(0, 80)}…` : desc) : "") ||
          "Fragment";
      }
      break;
    }
    case "mmrl_parcours": {
      const p = ctx.parcours.find((x) => x.id === itemId);
      if (p) {
        const v = ctx.victimes.find((vic) => vic.id === relId(p.victime_id));
        if (v?.auteur_user_id) {
          auteurUserId = v.auteur_user_id;
          const desc = p.description?.trim() || "";
          itemLabel =
            p.titre?.trim() ||
            (desc ? (desc.length > 80 ? `${desc.slice(0, 80)}…` : desc) : "") ||
            "Étape de parcours";
        }
      }
      break;
    }
    case "mmrl_recueil": {
      const r = ctx.recueil?.find((x) => x.id === itemId);
      if (r?.auteur_user_id) {
        auteurUserId = r.auteur_user_id;
        const c = r.contenu?.trim() || "";
        itemLabel =
          r.titre?.trim() ||
          (c ? (c.length > 60 ? `${c.slice(0, 60)}…` : c) : "") ||
          "Entrée du recueil";
      }
      break;
    }
    case "mmrl_relations_familiales": {
      const rel = ctx.relations?.find((x) => x.id === itemId);
      if (rel?.auteur_user_id) {
        auteurUserId = rel.auteur_user_id;
        const d = rel.description?.trim() || "";
        itemLabel = d ? (d.length > 60 ? `${d.slice(0, 60)}…` : d) : "Lien de parenté";
      }
      break;
    }
    case "mmrl_sepultures": {
      const s = ctx.sepultures?.find((x) => x.id === itemId);
      if (s?.auteur_user_id) {
        auteurUserId = s.auteur_user_id;
        const e = s.epitaphe?.trim() || "";
        itemLabel = e ? (e.length > 60 ? `${e.slice(0, 60)}…` : e) : "Sépulture virtuelle";
      }
      break;
    }
    default:
      return;
  }

  if (auteurUserId) {
    await notifyUserOnValidation(auteurUserId, type, collection, itemId, itemLabel);
  }
}

interface AuthUser {
  id: string;
  first_name?: string;
  last_name?: string;
  /** UUID du rôle Directus ou objet { id } selon l'API */
  role?: string | { id: string };
}

export const DIRECTUS_ROLE_ADMINISTRATOR = "af76e557-fb34-4a8b-9900-a6b60121662c";

export const isAdministratorUser = (user?: AuthUser | null) => {
  const role = user?.role;
  const id = typeof role === "string" ? role : role && typeof role === "object" && "id" in role ? String((role as { id: string }).id) : undefined;
  return id === DIRECTUS_ROLE_ADMINISTRATOR;
};

// Fonction utilitaire pour nommer l'utilisateur
export const getUserLabel = (user?: AuthUser | null) => {
  if (!user) return "Inconnu";
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name[0]}.`;
  if (user.first_name) return user.first_name;
  return "Contributeur";
};

async function getAdminUserIds(): Promise<string[]> {
  try {
    const admins = await directus.request(
      readUsers({
        filter: { role: { _eq: DIRECTUS_ROLE_ADMINISTRATOR } },
        fields: ["id"],
      })
    );
    return admins.map((a) => a.id);
  } catch (err) {
    console.error("Erreur récupération admins", err);
    return [];
  }
}

/** Collections pour lesquelles on notifie l'équipe lors d'une création. */
export type AdminNotifiableCollection =
  | "mmrl_victimes"
  | "mmrl_fragments"
  | "mmrl_parcours"
  | "mmrl_recueil"
  | "mmrl_relations_familiales"
  | "mmrl_sepultures";

const CREATE_NOTIFICATION_TYPE: Record<AdminNotifiableCollection, NotificationType> = {
  mmrl_victimes: "ajout_victime",
  mmrl_fragments: "ajout_fragment",
  mmrl_parcours: "ajout_parcours",
  mmrl_recueil: "ajout_recueil",
  mmrl_relations_familiales: "ajout_relation",
  mmrl_sepultures: "ajout_sepulture",
};

// Création côté serveur avec le jeton admin (fiable même si le contributeur n'a pas les droits sur mmrl_notifications)
export async function createNotification(
  destinataireUserId: string,
  emetteurUserId: string | null,
  type: NotificationType,
  collection: string,
  itemId: number,
  itemLabel: string,
  message: string
) {
  try {
    await directus.request(
      createItem("mmrl_notifications" as any, {
        destinataire_user_id: destinataireUserId,
        emetteur_user_id: emetteurUserId,
        type,
        collection,
        item_id: itemId,
        item_label: itemLabel,
        message,
        lu: false,
      })
    );
  } catch (err) {
    console.error("Erreur création notification", err);
  }
}

export async function notifyAdminsOnCreate(
  collection: AdminNotifiableCollection,
  itemId: number,
  itemLabel: string,
  emetteurUser: AuthUser
) {
  if (isAdministratorUser(emetteurUser)) return;

  const adminIds = await getAdminUserIds();
  const userName = getUserLabel(emetteurUser);
  const type = CREATE_NOTIFICATION_TYPE[collection];
  const message = `${userName} a ajouté : ${itemLabel}`;

  for (const adminId of adminIds) {
    if (adminId !== emetteurUser.id) {
      await createNotification(adminId, emetteurUser.id, type, collection, itemId, itemLabel, message);
    }
  }
}

export async function notifyAdminsOnUpdate(
  collection: string,
  itemId: number,
  itemLabel: string,
  emetteurUser: AuthUser
) {
  if (isAdministratorUser(emetteurUser)) return;

  const adminIds = await getAdminUserIds();
  const userName = getUserLabel(emetteurUser);
  const message = `${userName} a modifié : ${itemLabel}`;

  for (const adminId of adminIds) {
    if (adminId !== emetteurUser.id) {
      await createNotification(adminId, emetteurUser.id, "modification", collection, itemId, itemLabel, message);
    }
  }
}

export async function notifyUserOnValidation(
  auteurUserId: string,
  type: "validation" | "rejet",
  collection: string,
  itemId: number,
  itemLabel: string
) {
  const message =
    type === "validation"
      ? `Votre contribution « ${itemLabel} » a été validée par l’équipe et est désormais publiée.`
      : `Votre contribution « ${itemLabel} » n’a pas été retenue (marquée comme non fiable).`;

  await createNotification(auteurUserId, null, type, collection, itemId, itemLabel, message);
}
