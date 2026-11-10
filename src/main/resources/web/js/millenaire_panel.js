/**
 * BlueMap Millénaire Interactive Side Panel & Village Directory Extension
 * Dynamic Multi-Language Engine (MillenaireI18n) & Complete Localization
 * Compatible with BlueMap 5.29 & Millénaire 9.1.0 (MC 26.3 / NeoForge)
 * UI/UX Craftsman: Reactive i18n, Dark Surface Tokens, Contextual Tooltips & a11y
 */
(function () {
    "use strict";

    function escapeHtml(value) {
        if (value === null || value === undefined) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function sanitizeHexColor(color, fallback = "#3498db") {
        if (!color || typeof color !== "string") return fallback;
        const trimmed = color.trim();
        if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
        return fallback;
    }

    function getCultureIcon(cultureId) {
        switch (cultureId) {
            case "millenaire:norman": return "⚔️";
            case "millenaire:byzantines": return "👑";
            case "millenaire:japanese": return "⛩️";
            case "millenaire:mayan": return "☀️";
            case "millenaire:indian":
            case "millenaire:hindi": return "🪷";
            case "millenaire:inuits": return "❄️";
            case "millenaire:seljuk": return "🌙";
            default: return "🏛️";
        }
    }

    function getCultureColor(cultureId) {
        switch (cultureId) {
            case "millenaire:norman": return "#27ae60";
            case "millenaire:byzantines": return "#2980b9";
            case "millenaire:japanese": return "#c0392b";
            case "millenaire:mayan": return "#d68910";
            case "millenaire:indian":
            case "millenaire:hindi": return "#8e44ad";
            case "millenaire:inuits": return "#16a085";
            case "millenaire:seljuk": return "#d35400";
            default: return "#7f8c8d";
        }
    }

    function getRelationIcon(score) {
        if (score >= 70) return "🤝";
        if (score >= 30) return "🕊️";
        if (score >= -10) return "⚖️";
        if (score >= -50) return "⚠️";
        return "⚔️";
    }

    function getVillageTypeIcon(typeId, cultureId, isLone) {
        const t = (typeId || "").toLowerCase();
        const c = (cultureId || "").toLowerCase();
        if (t.includes("agricole") || t.includes("farm") || t.includes("harvest")) return "🌾";
        if (t.includes("artisan") || t.includes("craft") || t.includes("forge")) return "⚒️";
        if (t.includes("ecclesiastique") || t.includes("church") || t.includes("abbey") || t.includes("religious") || t.includes("monast")) return c.includes("byzant") ? "👑" : "⛪";
        if (t.includes("militaire") || t.includes("military") || t.includes("donjon")) return c.includes("mayan") ? "🏹" : "🛡️";
        if (t.includes("fort") || t.includes("rajput")) return c.includes("seljuk") || c.includes("indian") ? "🕌" : "⚔️";
        if (t.includes("grosbourg") || t.includes("town") || t.includes("centre")) return "🏰";
        if (t.includes("trading") || t.includes("marchand") || t.includes("market")) return "🪙";
        if (t.includes("notredame") || t.includes("merveille") || t.includes("wonder")) return "🏛️";
        if (t.includes("lumber") || t.includes("forest") || t.includes("bois")) return "🪓";
        if (t.includes("inn") || t.includes("auberge") || t.includes("tavern")) return "🍺";
        if (t.includes("bandit") || t.includes("shack") || t.includes("cave") || t.includes("repaire") || t.includes("pillard")) return "☠️";
        if (t.includes("mine") || t.includes("quarry")) return "⛏️";
        if (t.includes("kofun") || t.includes("kufun") || t.includes("tomb")) return "⛩️";
        if (t.includes("hunt") || t.includes("chasse")) return "🦭";
        if (isLone) return "🏕️";
        return "🏘️";
    }

    // Bidirectional stockpile name mappings for common items exported with translated labels
    const STOCKPILE_FR_TO_EN = {
        "Roche": "Stone",
        "Pierre": "Cobblestone",
        "Bûches (tout type)": "Logs (any type)",
        "Brique de terre": "Mud Brick",
        "Brique de boue": "Mud Brick",
        "Brique cuite": "Cooked Brick",
        "Chaume": "Thatch",
        "Verre": "Glass",
        "Fourneau": "Furnace",
        "Établi": "Crafting Table",
        "Coffre": "Chest",
        "Échelle": "Ladder",
        "Torche": "Torch",
        "Barreaux de fer": "Iron Bars",
        "Roche lisse": "Smooth Stone",
        "Pain": "Bread",
        "Cidre": "Cider",
        "Pomme": "Apple",
        "Blé": "Wheat",
        "Carotte": "Carrot",
        "Patate": "Potato",
        "Poisson": "Fish",
        "Viande cuite": "Cooked Meat",
        "Riz": "Rice",
        "Curry": "Curry",
        "Raisin": "Grapes",
        "Vin": "Wine",
        "Tripes": "Tripe",
        "Bière": "Beer",
        "Hydromel": "Mead",
        "Liqueur de cacao": "Cacao Liquor"
    };

    const STOCKPILE_EN_TO_FR = Object.fromEntries(
        Object.entries(STOCKPILE_FR_TO_EN).map(([fr, en]) => [en, fr])
    );

    // Functional categories for buildings with localized keys
    const BUILDING_CATEGORIES = [
        {
            test: (id, name) => id.includes("townhall") || name.includes("mairie") || name.includes("hôtel de ville") || name.includes("centre") || id.includes("centre"),
            icon: "🏛️",
            titleKey: "panel.millenaire.bld.townhall.title",
            descKey: "panel.millenaire.bld.townhall.desc",
            roleKey: "panel.millenaire.bld.townhall.role",
            fallbackTitle: "Bâtiment Central / Mairie",
            fallbackDesc: "Cœur politique et logistique du village. Centralise les coffres de deniers, planifie l'urbanisme et accueille les marchands.",
            fallbackRole: "Administration & Trésorerie"
        },
        {
            test: (id, name) => id.includes("church") || id.includes("eglise") || id.includes("chapel") || id.includes("abbey") || name.includes("église") || name.includes("abbaye"),
            icon: "⛪",
            titleKey: "panel.millenaire.bld.church.title",
            descKey: "panel.millenaire.bld.church.desc",
            roleKey: "panel.millenaire.bld.church.role",
            fallbackTitle: "Lieu de Culte / Église",
            fallbackDesc: "Sanctuaire spirituel où le prêtre ou le moine célèbre les offices, garantit la bénédiction du village et conserve les reliques.",
            fallbackRole: "Culte & Sérénité"
        },
        {
            test: (id, name) => id.includes("fort") || id.includes("castle") || id.includes("donjon") || name.includes("fort") || name.includes("château"),
            icon: "🛡️",
            titleKey: "panel.millenaire.bld.fort.title",
            descKey: "panel.millenaire.bld.fort.desc",
            roleKey: "panel.millenaire.bld.fort.role",
            fallbackTitle: "Fortification / Donjon",
            fallbackDesc: "Ouvrage militaire majeur abritant le chef d'armes, la garnison et les réserves de guerre en cas d'attaque ennemie.",
            fallbackRole: "Défense & Commandement"
        },
        {
            test: (id, name) => id.includes("borderpost") || id.includes("wall") || id.includes("gate") || name.includes("frontière") || name.includes("muraille") || name.includes("porte"),
            icon: "🧱",
            titleKey: "panel.millenaire.bld.wall.title",
            descKey: "panel.millenaire.bld.wall.desc",
            roleKey: "panel.millenaire.bld.wall.role",
            fallbackTitle: "Poste Frontière & Remparts",
            fallbackDesc: "Délimite l'emprise territoriale du village. Fournit des postes de guet surélevés pour repérer les intrus et les monstres.",
            fallbackRole: "Sécurité & Délimitation"
        },
        {
            test: (id, name) => id.includes("farm") || id.includes("champ") || name.includes("ferme") || name.includes("verger") || name.includes("grange"),
            icon: "🌾",
            titleKey: "panel.millenaire.bld.farm.title",
            descKey: "panel.millenaire.bld.farm.desc",
            roleKey: "panel.millenaire.bld.farm.role",
            fallbackTitle: "Ferme & Exploitation Vivrière",
            fallbackDesc: "Produit les céréales, légumes et denrées de subsistance pour nourrir les villageois et stimuler la natalité.",
            fallbackRole: "Production Vivrière"
        },
        {
            test: (id, name) => id.includes("bakery") || id.includes("boulang") || id.includes("mill") || name.includes("four") || name.includes("moulin"),
            icon: "🍞",
            titleKey: "panel.millenaire.bld.bakery.title",
            descKey: "panel.millenaire.bld.bakery.desc",
            roleKey: "panel.millenaire.bld.bakery.role",
            fallbackTitle: "Fournil / Moulin Artisanal",
            fallbackDesc: "Transforme les céréales brutes en farine puis en pains savoureux pour alimenter la réserve centrale de nourriture.",
            fallbackRole: "Transformation des Vivres"
        },
        {
            test: (id, name) => id.includes("forge") || id.includes("smith") || name.includes("forge") || name.includes("armurerie"),
            icon: "⚒️",
            titleKey: "panel.millenaire.bld.forge.title",
            descKey: "panel.millenaire.bld.forge.desc",
            roleKey: "panel.millenaire.bld.forge.role",
            fallbackTitle: "Forge & Métallurgie",
            fallbackDesc: "Atelier où le forgeron façonne des outils agraires robustes et des armes en fer pour équiper les sentinelles.",
            fallbackRole: "Outillage & Équipement"
        },
        {
            test: (id, name) => id.includes("lumber") || id.includes("wood") || name.includes("bûcheron") || name.includes("scie"),
            icon: "🪓",
            titleKey: "panel.millenaire.bld.lumber.title",
            descKey: "panel.millenaire.bld.lumber.desc",
            roleKey: "panel.millenaire.bld.lumber.role",
            fallbackTitle: "Poste de Bûcheron",
            fallbackDesc: "Cabane de forestier abattant et taillant les arbres environnants pour fournir le bois indispensable aux chantiers.",
            fallbackRole: "Ressources Sylvicoles"
        },
        {
            test: (id, name) => id.includes("quarry") || id.includes("mine") || name.includes("carrière") || name.includes("mine"),
            icon: "⛏️",
            titleKey: "panel.millenaire.bld.quarry.title",
            descKey: "panel.millenaire.bld.quarry.desc",
            roleKey: "panel.millenaire.bld.quarry.role",
            fallbackTitle: "Carrière d'Extraction",
            fallbackDesc: "Gisement de pierre, sable ou argile extrait activement pour approvisionner les maçons et briquetiers du village.",
            fallbackRole: "Matériaux de Construction"
        },
        {
            test: (id, name) => id.includes("inn") || id.includes("tavern") || name.includes("auberge") || name.includes("taverne"),
            icon: "🍺",
            titleKey: "panel.millenaire.bld.inn.title",
            descKey: "panel.millenaire.bld.inn.desc",
            roleKey: "panel.millenaire.bld.inn.role",
            fallbackTitle: "Auberge / Taverne",
            fallbackDesc: "Lieu de convivialité villageois servant du cidre ou du vin, favorisant les échanges et la venue de voyageurs marchands.",
            fallbackRole: "Commerce & Convivialité"
        },
        {
            test: (id, name) => id.includes("house") || id.includes("maison") || id.includes("hab") || name.includes("maison"),
            icon: "🏠",
            titleKey: "panel.millenaire.bld.house.title",
            descKey: "panel.millenaire.bld.house.desc",
            roleKey: "panel.millenaire.bld.house.role",
            fallbackTitle: "Maison d'Habitation",
            fallbackDesc: "Demeure résidentielle hébergeant une famille de villageois et leurs enfants, contribuant à la croissance démographique.",
            fallbackRole: "Logement & Population"
        }
    ];

    // Embedded in-memory UI fallbacks for instant display before network fetch completes
    const EMBEDDED_UI_FALLBACKS = {
        fr: {
            "panel.millenaire.directory.toggle_button": "Afficher l'annuaire des villages Millénaire",
            "panel.millenaire.directory.title": "Annuaire des Villages Millénaire",
            "panel.millenaire.directory.villages_tab": "Villages",
            "panel.millenaire.directory.search_placeholder": "Rechercher un village ou une culture...",
            "panel.millenaire.directory.search_label": "Recherche",
            "panel.millenaire.directory.filter_all": "Tous",
            "panel.millenaire.directory.filter_villages": "Villages",
            "panel.millenaire.directory.filter_lone": "Isolés",
            "panel.millenaire.directory.empty": "Aucun village correspondant trouvé.",
            "panel.millenaire.directory.goto_title": "Centrer et inspecter",
            "panel.millenaire.panel_details_aria": "Détails du village Millénaire",
            "panel.millenaire.button.close": "Fermer",
            "panel.millenaire.button.close_directory": "Fermer l'annuaire",
            "panel.millenaire.button.close_panel": "Fermer le panneau",
            "panel.millenaire.button.back_to_directory": "Retour à l'annuaire",
            "panel.millenaire.button.back_to_list": "Retour à la liste des villages",
            "panel.millenaire.type_pill_title": "Cliquer ou survoler pour la description",
            "panel.millenaire.coords_title": "Coordonnées du centre",
            "panel.millenaire.focus_btn_text": "Centrer",
            "panel.millenaire.focus_btn_title": "Centrer la vue 3D",
            "panel.millenaire.badge.under_attack": "🔥 Sous attaque !",
            "panel.millenaire.badge.active_raid_target": "Raid en cours contre {target}",
            "panel.millenaire.badge.raiding_to": "⚔️ En raid → {target}",
            "panel.millenaire.badge.peaceful": "🕊️ Paisible",
            "panel.millenaire.stat.defense_title": "Force défensive",
            "panel.millenaire.stat.defense_short": "Déf: ",
            "panel.millenaire.stat.raid_strength_title": "Force de raid",
            "panel.millenaire.stat.raid_short": "Raid: ",
            "panel.millenaire.stat.buildings_count": "Nombre de bâtiments",
            "panel.millenaire.stat.buildings_short_label": "Bât: ",
            "panel.millenaire.stat.inhabitants_short": "hab.",
            "panel.millenaire.stat.buildings_short": "bât.",
            "panel.millenaire.stat.relations_short": "rel.",
            "panel.millenaire.tab.population": "👥 Population",
            "panel.millenaire.tab.economy": "📦 Économie & Travaux",
            "panel.millenaire.tab.diplomacy": "🤝 Diplomatie",
            "panel.millenaire.sync_realtime": "Synchronisation en temps réel",
            "panel.millenaire.updated_at": "Mis à jour à {time} • Monde : {world}",
            "panel.millenaire.stat.population": "Population Totale",
            "panel.millenaire.stat.men": "Hommes",
            "panel.millenaire.stat.women": "Femmes",
            "panel.millenaire.stat.children": "Enfants",
            "panel.millenaire.section.roster": "Registre des Habitants",
            "panel.millenaire.roster.no_villagers": "Aucun habitant recensé.",
            "panel.millenaire.military_strength_title": "Force militaire: {strength}",
            "panel.millenaire.badge.raiding": "⚔️ Raid",
            "panel.millenaire.badge.hired": "🤝 Embauché",
            "panel.millenaire.badge.killed": "💀 Décédé",
            "panel.millenaire.economy.deniers": "Trésorerie & Réserves Majeures",
            "panel.millenaire.economy.deniers_gold_short": "Or",
            "panel.millenaire.economy.deniers_silver_short": "Argent",
            "panel.millenaire.economy.deniers_copper_short": "Bronze",
            "panel.millenaire.economy.wood_short": "Bois",
            "panel.millenaire.economy.stone_short": "Pierre",
            "panel.millenaire.economy.food_short": "Nourriture",
            "panel.millenaire.section.projects": "Chantiers de Construction",
            "panel.millenaire.project.no_projects": "Aucun chantier en cours actuellement.",
            "panel.millenaire.project.default_name": "Chantier",
            "panel.millenaire.project.blocked": "⚠️ Chantier suspendu : matériaux manquants en coffres",
            "panel.millenaire.project.req_title": "Matériaux requis pour l'étape :",
            "panel.millenaire.project.missing_count": "⚠️ {count} manquant(s)",
            "panel.millenaire.project.ready_tag": "✓ Approvisionné",
            "panel.millenaire.project.resource_sufficient": "Ressource suffisante en stock",
            "panel.millenaire.project.resource_deficit": "Déficit de {diff} unités",
            "panel.millenaire.section.stockpiles": "Détail des Stocks en Coffres",
            "panel.millenaire.stockpile.empty": "Aucune marchandise recensée dans les coffres.",
            "panel.millenaire.section.buildings": "Bâtiments Établis",
            "panel.millenaire.buildings.no_buildings": "Aucun bâtiment établi.",
            "panel.millenaire.buildings.fortifications": "Fortifications",
            "panel.millenaire.buildings.click_to_focus": "Cliquer pour centrer la caméra 3D",
            "panel.millenaire.buildings.click_to_focus_zone": "Cliquer pour centrer la zone",
            "panel.millenaire.section.diplomacy": "Relations Inter-Villages",
            "panel.millenaire.diplomacy.raid_banner_prefix": "Expédition militaire en cours :",
            "panel.millenaire.diplomacy.raid_banner_body": "Ce village mène un raid offensif vers {target} !",
            "panel.millenaire.diplomacy.no_relations": "Aucune relation diplomatique externe enregistrée pour cet établissement.",
            "panel.millenaire.diplomacy.distance": "• Distance : {dist} m",
            "panel.millenaire.diplomacy.view_btn": "Voir",
            "panel.millenaire.diplomacy.view_btn_title": "Centrer la carte 3D sur ce village",
            "panel.millenaire.diplomacy.view_btn_aria": "Centrer sur {target}",
            "panel.millenaire.badge.lone_building": "Bâtiment Isolé",
            "panel.millenaire.section.community": "Communauté Villageoise",
            "panel.millenaire.lore.lone_building_desc": "Un avant-poste indépendant ou une demeure autonome vivant en autarcie dans la nature sans gouvernance de village.",
            "panel.millenaire.lore.community_desc": "Un village Millénaire autonome doté de son propre modèle économique, de ses artisans et de ses lois coutumières.",
            "panel.millenaire.lore.lone_specialty": "Autarcie • Commerce autonome • Présence locale",
            "panel.millenaire.lore.community_specialty": "Économie locale • Urbanisme dynamique • Diplomatie",
            "panel.millenaire.tooltip.title": "Titre",
            "panel.millenaire.tooltip.desc": "Description",
            "panel.millenaire.tooltip.tag": "Spécialité",
            "panel.millenaire.unknown_item": "Matériau inconnu",
            "panel.millenaire.lang_selector_aria": "Choisir la langue / Select language",
            "panel.millenaire.bld.townhall.title": "Bâtiment Central / Mairie",
            "panel.millenaire.bld.townhall.desc": "Cœur politique et logistique du village. Centralise les coffres de deniers, planifie l'urbanisme et accueille les marchands.",
            "panel.millenaire.bld.townhall.role": "Administration & Trésorerie",
            "panel.millenaire.bld.church.title": "Lieu de Culte / Église",
            "panel.millenaire.bld.church.desc": "Sanctuaire spirituel où le prêtre ou le moine célèbre les offices, garantit la bénédiction du village et conserve les reliques.",
            "panel.millenaire.bld.church.role": "Culte & Sérénité",
            "panel.millenaire.bld.fort.title": "Fortification / Donjon",
            "panel.millenaire.bld.fort.desc": "Ouvrage militaire majeur abritant le chef d'armes, la garnison et les réserves de guerre en cas d'attaque ennemie.",
            "panel.millenaire.bld.fort.role": "Défense & Commandement",
            "panel.millenaire.bld.wall.title": "Poste Frontière & Remparts",
            "panel.millenaire.bld.wall.desc": "Délimite l'emprise territoriale du village. Fournit des postes de guet surélevés pour repérer les intrus et les monstres.",
            "panel.millenaire.bld.wall.role": "Sécurité & Délimitation",
            "panel.millenaire.bld.farm.title": "Ferme & Exploitation Vivrière",
            "panel.millenaire.bld.farm.desc": "Produit les céréales, légumes et denrées de subsistance pour nourrir les villageois et stimuler la natalité.",
            "panel.millenaire.bld.farm.role": "Production Vivrière",
            "panel.millenaire.bld.bakery.title": "Fournil / Moulin Artisanal",
            "panel.millenaire.bld.bakery.desc": "Transforme les céréales brutes en farine puis en pains savoureux pour alimenter la réserve centrale de nourriture.",
            "panel.millenaire.bld.bakery.role": "Transformation des Vivres",
            "panel.millenaire.bld.forge.title": "Forge & Métallurgie",
            "panel.millenaire.bld.forge.desc": "Atelier où le forgeron façonne des outils agraires robustes et des armes en fer pour équiper les sentinelles.",
            "panel.millenaire.bld.forge.role": "Outillage & Équipement",
            "panel.millenaire.bld.lumber.title": "Poste de Bûcheron",
            "panel.millenaire.bld.lumber.desc": "Cabane de forestier abattant et taillant les arbres environnants pour fournir le bois indispensable aux chantiers.",
            "panel.millenaire.bld.lumber.role": "Ressources Sylvicoles",
            "panel.millenaire.bld.quarry.title": "Carrière d'Extraction",
            "panel.millenaire.bld.quarry.desc": "Gisement de pierre, sable ou argile extrait activement pour approvisionner les maçons et briquetiers du village.",
            "panel.millenaire.bld.quarry.role": "Matériaux de Construction",
            "panel.millenaire.bld.inn.title": "Auberge / Taverne",
            "panel.millenaire.bld.inn.desc": "Lieu de convivialité villageois servant du cidre ou du vin, favorisant les échanges et la venue de voyageurs marchands.",
            "panel.millenaire.bld.inn.role": "Commerce & Convivialité",
            "panel.millenaire.bld.house.title": "Maison d'Habitation",
            "panel.millenaire.bld.house.desc": "Demeure résidentielle hébergeant une famille de villageois et leurs enfants, contribuant à la croissance démographique.",
            "panel.millenaire.bld.house.role": "Logement & Population",
            "panel.millenaire.bld.generic.title": "Bâtiment Communautaire",
            "panel.millenaire.bld.generic.desc": "Structure villageoise établie contribuant à l'essor, à l'organisation ou au patrimoine de la communauté locale.",
            "panel.millenaire.bld.generic.role": "Infrastructure du village",
            "millenaire.bridge.ui.building": "Bâtiment",
            "millenaire.bridge.ui.coords": "X: {x}, Y: {y}, Z: {z}",
            "millenaire.bridge.ui.level": "Niv. {level}",
            "millenaire.bridge.ui.unknown_culture": "Culture Inconnue",
            "millenaire.bridge.ui.unknown_village": "Village Inconnu",
            "millenaire.bridge.ui.unknown_name": "Inconnu",
            "millenaire.bridge.ui.villager": "Villageois",
            "relation.millenaire.neutral": "Neutre"
        },
        en: {
            "panel.millenaire.directory.toggle_button": "Show Millénaire Village Directory",
            "panel.millenaire.directory.title": "Millénaire Village Directory",
            "panel.millenaire.directory.villages_tab": "Villages",
            "panel.millenaire.directory.search_placeholder": "Search village or culture...",
            "panel.millenaire.directory.search_label": "Search",
            "panel.millenaire.directory.filter_all": "All",
            "panel.millenaire.directory.filter_villages": "Villages",
            "panel.millenaire.directory.filter_lone": "Isolated",
            "panel.millenaire.directory.empty": "No matching villages found.",
            "panel.millenaire.directory.goto_title": "Center and inspect",
            "panel.millenaire.panel_details_aria": "Millénaire village details",
            "panel.millenaire.button.close": "Close",
            "panel.millenaire.button.close_directory": "Close directory",
            "panel.millenaire.button.close_panel": "Close panel",
            "panel.millenaire.button.back_to_directory": "Back to directory",
            "panel.millenaire.button.back_to_list": "Back to village list",
            "panel.millenaire.type_pill_title": "Click or hover for description",
            "panel.millenaire.coords_title": "Center coordinates",
            "panel.millenaire.focus_btn_text": "Center",
            "panel.millenaire.focus_btn_title": "Center 3D camera",
            "panel.millenaire.badge.under_attack": "🔥 Under attack!",
            "panel.millenaire.badge.active_raid_target": "Raid in progress against {target}",
            "panel.millenaire.badge.raiding_to": "⚔️ Raiding → {target}",
            "panel.millenaire.badge.peaceful": "🕊️ Peaceful",
            "panel.millenaire.stat.defense_title": "Defensive strength",
            "panel.millenaire.stat.defense_short": "Def: ",
            "panel.millenaire.stat.raid_strength_title": "Raid strength",
            "panel.millenaire.stat.raid_short": "Raid: ",
            "panel.millenaire.stat.buildings_count": "Number of buildings",
            "panel.millenaire.stat.buildings_short_label": "Bld: ",
            "panel.millenaire.stat.inhabitants_short": "hab.",
            "panel.millenaire.stat.buildings_short": "bld.",
            "panel.millenaire.stat.relations_short": "rel.",
            "panel.millenaire.tab.population": "👥 Population",
            "panel.millenaire.tab.economy": "📦 Economy & Projects",
            "panel.millenaire.tab.diplomacy": "🤝 Diplomacy",
            "panel.millenaire.sync_realtime": "Real-time synchronization",
            "panel.millenaire.updated_at": "Updated at {time} • World: {world}",
            "panel.millenaire.stat.population": "Total Population",
            "panel.millenaire.stat.men": "Men",
            "panel.millenaire.stat.women": "Women",
            "panel.millenaire.stat.children": "Children",
            "panel.millenaire.section.roster": "Villager Register",
            "panel.millenaire.roster.no_villagers": "No villagers recorded.",
            "panel.millenaire.military_strength_title": "Military strength: {strength}",
            "panel.millenaire.badge.raiding": "⚔️ Raid",
            "panel.millenaire.badge.hired": "🤝 Hired",
            "panel.millenaire.badge.killed": "💀 Fallen",
            "panel.millenaire.economy.deniers": "Treasury & Major Reserves",
            "panel.millenaire.economy.deniers_gold_short": "Gold",
            "panel.millenaire.economy.deniers_silver_short": "Silver",
            "panel.millenaire.economy.deniers_copper_short": "Bronze",
            "panel.millenaire.economy.wood_short": "Wood",
            "panel.millenaire.economy.stone_short": "Stone",
            "panel.millenaire.economy.food_short": "Food",
            "panel.millenaire.section.projects": "Construction Projects",
            "panel.millenaire.project.no_projects": "No active construction projects.",
            "panel.millenaire.project.default_name": "Project",
            "panel.millenaire.project.blocked": "⚠️ Construction suspended: missing materials in chests",
            "panel.millenaire.project.req_title": "Required materials for step:",
            "panel.millenaire.project.missing_count": "⚠️ {count} missing",
            "panel.millenaire.project.ready_tag": "✓ Supplied",
            "panel.millenaire.project.resource_sufficient": "Sufficient resource in stock",
            "panel.millenaire.project.resource_deficit": "Deficit of {diff} units",
            "panel.millenaire.section.stockpiles": "Chest Inventory Details",
            "panel.millenaire.stockpile.empty": "No items recorded in chests.",
            "panel.millenaire.section.buildings": "Established Buildings",
            "panel.millenaire.buildings.no_buildings": "No established buildings.",
            "panel.millenaire.buildings.fortifications": "Fortifications",
            "panel.millenaire.buildings.click_to_focus": "Click to center 3D camera",
            "panel.millenaire.buildings.click_to_focus_zone": "Click to center zone",
            "panel.millenaire.section.diplomacy": "Inter-Village Relations",
            "panel.millenaire.diplomacy.raid_banner_prefix": "Military expedition in progress:",
            "panel.millenaire.diplomacy.raid_banner_body": "This village is conducting a raid against {target}!",
            "panel.millenaire.diplomacy.no_relations": "No external diplomatic relations recorded for this settlement.",
            "panel.millenaire.diplomacy.distance": "• Distance: {dist} m",
            "panel.millenaire.diplomacy.view_btn": "View",
            "panel.millenaire.diplomacy.view_btn_title": "Center 3D map on this village",
            "panel.millenaire.diplomacy.view_btn_aria": "Center on {target}",
            "panel.millenaire.badge.lone_building": "Lone Building",
            "panel.millenaire.section.community": "Village Community",
            "panel.millenaire.lore.lone_building_desc": "An independent outpost or autonomous homestead living self-sufficiently without village governance.",
            "panel.millenaire.lore.community_desc": "An autonomous Millénaire village with its own economic model, artisans, and customary laws.",
            "panel.millenaire.lore.lone_specialty": "Self-reliance • Independent trade • Local presence",
            "panel.millenaire.lore.community_specialty": "Local economy • Dynamic urbanism • Diplomacy",
            "panel.millenaire.tooltip.title": "Title",
            "panel.millenaire.tooltip.desc": "Description",
            "panel.millenaire.tooltip.tag": "Specialty",
            "panel.millenaire.unknown_item": "Unknown material",
            "panel.millenaire.lang_selector_aria": "Select language / Choisir la langue",
            "panel.millenaire.bld.townhall.title": "Central Building / Town Hall",
            "panel.millenaire.bld.townhall.desc": "Political and logistical heart of the village. Centralizes currency chests, manages urban planning, and welcomes merchants.",
            "panel.millenaire.bld.townhall.role": "Administration & Treasury",
            "panel.millenaire.bld.church.title": "Place of Worship / Church",
            "panel.millenaire.bld.church.desc": "Spiritual sanctuary where the priest or monk leads services, bestows blessings upon the village, and safeguards holy relics.",
            "panel.millenaire.bld.church.role": "Worship & Serenity",
            "panel.millenaire.bld.fort.title": "Fortification / Keep",
            "panel.millenaire.bld.fort.desc": "Major military stronghold housing the captain of the guard, the garrison, and war supplies in the event of an attack.",
            "panel.millenaire.bld.fort.role": "Defense & Command",
            "panel.millenaire.bld.wall.title": "Border Post & Ramparts",
            "panel.millenaire.bld.wall.desc": "Defines the territorial boundaries of the settlement. Provides elevated watchposts to spot intruders and hostile creatures.",
            "panel.millenaire.bld.wall.role": "Security & Demarcation",
            "panel.millenaire.bld.farm.title": "Farm & Food Production",
            "panel.millenaire.bld.farm.desc": "Produces grain, crops, and essential foodstuffs to sustain villagers and promote population growth.",
            "panel.millenaire.bld.farm.role": "Food Production",
            "panel.millenaire.bld.bakery.title": "Bakery / Mill",
            "panel.millenaire.bld.bakery.desc": "Processes raw grain into flour and freshly baked bread to replenish the central food supply.",
            "panel.millenaire.bld.bakery.role": "Food Processing",
            "panel.millenaire.bld.forge.title": "Forge & Metallurgy",
            "panel.millenaire.bld.forge.desc": "Workshop where the blacksmith crafts sturdy farming implements and iron weaponry for sentinels.",
            "panel.millenaire.bld.forge.role": "Tools & Armament",
            "panel.millenaire.bld.lumber.title": "Lumberman Post",
            "panel.millenaire.bld.lumber.desc": "Woodcutter shelter harvesting timber from surrounding forests, supplying wood essential for building projects.",
            "panel.millenaire.bld.lumber.role": "Forestry Resources",
            "panel.millenaire.bld.quarry.title": "Extraction Quarry",
            "panel.millenaire.bld.quarry.desc": "Active deposit of stone, sand, or clay quarried to supply the village masons and brickmakers.",
            "panel.millenaire.bld.quarry.role": "Building Materials",
            "panel.millenaire.bld.inn.title": "Inn / Tavern",
            "panel.millenaire.bld.inn.desc": "Convivial gathering place serving cider or wine, fostering social ties and welcoming itinerant merchants.",
            "panel.millenaire.bld.inn.role": "Trade & Hospitality",
            "panel.millenaire.bld.house.title": "Residential House",
            "panel.millenaire.bld.house.desc": "Family home sheltering a villager couple and their children, contributing to demographic growth.",
            "panel.millenaire.bld.house.role": "Housing & Population",
            "panel.millenaire.bld.generic.title": "Community Building",
            "panel.millenaire.bld.generic.desc": "Established village structure contributing to local development, organization, or heritage.",
            "panel.millenaire.bld.generic.role": "Village Infrastructure",
            "millenaire.bridge.ui.building": "Building",
            "millenaire.bridge.ui.coords": "X: {x}, Y: {y}, Z: {z}",
            "millenaire.bridge.ui.level": "Lvl. {level}",
            "millenaire.bridge.ui.unknown_culture": "Unknown Culture",
            "millenaire.bridge.ui.unknown_village": "Unknown Village",
            "millenaire.bridge.ui.unknown_name": "Unknown",
            "millenaire.bridge.ui.villager": "Villager",
            "relation.millenaire.neutral": "Neutral"
        }
    };

    class MillenaireI18n {
        constructor() {
            this.currentLocale = "fr";
            this.dictionaries = {};
            this.translations = {};
            this.fallbackTranslations = {};
            this.listeners = [];
            this.initialized = false;
            this.supportedLocales = {
                "fr": { code: "fr", name: "Français", flag: "🇫🇷", file: "fr.json" },
                "en": { code: "en", name: "English", flag: "🇬🇧", file: "en.json" },
                "de": { code: "de", name: "Deutsch", flag: "🇩🇪", file: "de.json" },
                "es": { code: "es", name: "Español", flag: "🇪🇸", file: "es.json" },
                "it": { code: "it", name: "Italiano", flag: "🇮🇹", file: "it.json" },
                "ru": { code: "ru", name: "Русский", flag: "🇷🇺", file: "ru.json" },
                "zh": { code: "zh", name: "简体中文", flag: "🇨🇳", file: "zh.json" },
                "zh-tw": { code: "zh-tw", name: "繁體中文", flag: "🇹🇼", file: "zh_tw.json" },
                "ja": { code: "ja", name: "日本語", flag: "🇯🇵", file: "ja.json" },
                "ko": { code: "ko", name: "한국어", flag: "🇰🇷", file: "ko.json" },
                "pt": { code: "pt", name: "Português", flag: "🇵🇹", file: "pt.json" },
                "pt-br": { code: "pt-br", name: "Português (Brasil)", flag: "🇧🇷", file: "pt_br.json" },
                "pl": { code: "pl", name: "Polski", flag: "🇵🇱", file: "pl.json" },
                "nl": { code: "nl", name: "Nederlands", flag: "🇳🇱", file: "nl.json" },
                "uk": { code: "uk", name: "Українська", flag: "🇺🇦", file: "uk.json" },
                "cs": { code: "cs", name: "Čeština", flag: "🇨🇿", file: "cs.json" },
                "da": { code: "da", name: "Dansk", flag: "🇩🇰", file: "da.json" },
                "sv": { code: "sv", name: "Svenska", flag: "🇸🇪", file: "sv.json" },
                "nb": { code: "nb", name: "Norsk", flag: "🇳🇴", file: "nb.json" },
                "tr": { code: "tr", name: "Türkçe", flag: "🇹🇷", file: "tr.json" },
                "ar": { code: "ar", name: "العربية", flag: "🇸🇦", file: "ar.json" },
                "hu": { code: "hu", name: "Magyar", flag: "🇭🇺", file: "hu.json" },
                "et": { code: "et", name: "Eesti", flag: "🇪🇪", file: "et.json" },
                "sl": { code: "sl", name: "Slovenščina", flag: "🇸🇮", file: "sl.json" },
                "th": { code: "th", name: "ไทย", flag: "🇹🇭", file: "th.json" },
                "hi": { code: "hi", name: "हिन्दी", flag: "🇮🇳", file: "hi.json" }
            };
        }

        resolveLocaleCode(rawCode) {
            if (!rawCode || typeof rawCode !== "string") return null;
            const norm = rawCode.toLowerCase().replace("_", "-");
            const prefix = norm.split("-")[0];
            if (this.supportedLocales[norm]) return norm;
            if (this.supportedLocales[prefix]) return prefix;
            if (norm.startsWith("zh-tw") || norm.startsWith("zh-hk")) return "zh-tw";
            if (norm.startsWith("zh")) return "zh";
            if (norm.startsWith("pt-br")) return "pt-br";
            if (norm.startsWith("pt")) return "pt";
            if (norm.startsWith("no") || norm.startsWith("nb")) return "nb";
            return null;
        }

        detectInitialLocale() {
            // 1. Persisted user choice
            try {
                const saved = localStorage.getItem("millenaire_bridge_lang");
                if (saved) {
                    const match = this.resolveLocaleCode(saved);
                    if (match) return match;
                }
            } catch (_) {}

            // 2. Active BlueMap language
            try {
                const bm = (document.documentElement && document.documentElement.lang) || "";
                if (bm) {
                    const match = this.resolveLocaleCode(bm);
                    if (match) return match;
                }
            } catch (_) {}

            // 3. Browser navigator language
            try {
                const navLangs = (typeof navigator !== "undefined" && navigator.languages) || [(typeof navigator !== "undefined" && navigator.language) || "fr"];
                for (const l of navLangs) {
                    const match = this.resolveLocaleCode(l);
                    if (match) return match;
                }
            } catch (_) {}

            // 4. Default fallback
            return "fr";
        }

        async init() {
            if (this.initialized) return;
            const targetLocale = this.detectInitialLocale();
            this.currentLocale = targetLocale;
            await this.loadLocale(targetLocale);
            this.translations = this.dictionaries[targetLocale] || {};
            
            // Preload secondary locale in background for deep fallbacks
            const otherLocale = targetLocale === "fr" ? "en" : "fr";
            this.loadLocale(otherLocale).then(dict => {
                this.fallbackTranslations = dict || {};
            }).catch(() => {});

            this.initialized = true;
            this.setupBlueMapObserver();
        }

        setupBlueMapObserver() {
            if (typeof MutationObserver === "undefined" || typeof document === "undefined" || !document.documentElement) return;
            try {
                const observer = new MutationObserver((mutations) => {
                    for (const m of mutations) {
                        if (m.type === "attributes" && m.attributeName === "lang") {
                            try {
                                const saved = localStorage.getItem("millenaire_bridge_lang");
                                if (!saved) {
                                    const bm = document.documentElement.lang;
                                    const resolved = this.resolveLocaleCode(bm);
                                    if (resolved && resolved !== this.currentLocale) {
                                        this.setLocale(resolved);
                                    }
                                }
                            } catch (_) {}
                        }
                    }
                });
                observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
            } catch (_) {}
        }

        async loadLocale(locale) {
            const norm = this.resolveLocaleCode(locale) || "fr";
            if (this.dictionaries[norm]) {
                return this.dictionaries[norm];
            }
            if (typeof fetch === "function") {
                try {
                    const res = await fetch(`data/lang/${norm}.json?t=${Date.now()}`);
                    if (res.ok) {
                        const data = await res.json();
                        this.dictionaries[norm] = data;
                        return data;
                    }
                } catch (_) {
                    // Fallback to embedded
                }
            }
            const embedded = EMBEDDED_UI_FALLBACKS[norm] || EMBEDDED_UI_FALLBACKS["fr"] || {};
            this.dictionaries[norm] = embedded;
            return embedded;
        }

        async setLocale(localeCode) {
            const resolved = this.resolveLocaleCode(localeCode) || "fr";
            this.currentLocale = resolved;
            try {
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem("millenaire_bridge_lang", resolved);
                }
            } catch (_) {}

            const dict = await this.loadLocale(resolved);
            this.translations = dict || {};

            // Synchronize secondary fallback
            const otherLocale = resolved === "fr" ? "en" : "fr";
            if (this.dictionaries[otherLocale]) {
                this.fallbackTranslations = this.dictionaries[otherLocale];
            }

            // Notify listeners (UI reactive re-render)
            for (const cb of this.listeners) {
                try {
                    cb(resolved);
                } catch (err) {
                    console.error("Error in i18n locale listener:", err);
                }
            }
        }

        onLocaleChanged(callback) {
            if (typeof callback === "function") {
                this.listeners.push(callback);
            }
        }

        has(key) {
            if (!key) return false;
            if (this.translations && Object.prototype.hasOwnProperty.call(this.translations, key)) return true;
            if (this.fallbackTranslations && Object.prototype.hasOwnProperty.call(this.fallbackTranslations, key)) return true;
            const emb = EMBEDDED_UI_FALLBACKS[this.currentLocale];
            if (emb && Object.prototype.hasOwnProperty.call(emb, key)) return true;
            return false;
        }

        t(key, fallback = "", params = null) {
            if (!key) return fallback || "";
            let val = null;
            if (this.translations && Object.prototype.hasOwnProperty.call(this.translations, key)) {
                val = this.translations[key];
            }
            if (!val && this.fallbackTranslations && Object.prototype.hasOwnProperty.call(this.fallbackTranslations, key)) {
                val = this.fallbackTranslations[key];
            }
            if (!val && EMBEDDED_UI_FALLBACKS[this.currentLocale] && Object.prototype.hasOwnProperty.call(EMBEDDED_UI_FALLBACKS[this.currentLocale], key)) {
                val = EMBEDDED_UI_FALLBACKS[this.currentLocale][key];
            }
            if (!val && EMBEDDED_UI_FALLBACKS["en"] && Object.prototype.hasOwnProperty.call(EMBEDDED_UI_FALLBACKS["en"], key)) {
                val = EMBEDDED_UI_FALLBACKS["en"][key];
            }
            if (!val && EMBEDDED_UI_FALLBACKS["fr"] && Object.prototype.hasOwnProperty.call(EMBEDDED_UI_FALLBACKS["fr"], key)) {
                val = EMBEDDED_UI_FALLBACKS["fr"][key];
            }
            if (!val) {
                val = (fallback !== undefined && fallback !== null && fallback !== "") ? fallback : key;
            }
            if (params && typeof params === "object") {
                for (const [pKey, pVal] of Object.entries(params)) {
                    val = String(val).replaceAll(`{${pKey}}`, pVal);
                }
            }
            return String(val);
        }

        translateItem(itemId, fallbackName) {
            if (!itemId) {
                return fallbackName || this.t("panel.millenaire.unknown_item", "Matériau inconnu");
            }
            if (itemId.includes(":")) {
                const parts = itemId.split(":");
                const ns = parts[0];
                const name = parts.slice(1).join(":");
                const nameNoUnderscore = name.replace(/_/g, "");
                const nameFixed = name.replace("mudbrick", "mud_brick").replace("cookedbrick", "cooked_brick");
                const candidates = [
                    `item.${ns}.${name}`,
                    `block.${ns}.${name}`,
                    `item.${ns}.${nameFixed}`,
                    `block.${ns}.${nameFixed}`,
                    `item.${ns}.${nameNoUnderscore}`,
                    `block.${ns}.${nameNoUnderscore}`
                ];
                for (const cand of candidates) {
                    if (this.has(cand)) {
                        return this.t(cand);
                    }
                }
            }
            if (this.has(itemId)) {
                return this.t(itemId);
            }
            if (fallbackName && fallbackName !== itemId && !fallbackName.startsWith("minecraft:") && !fallbackName.startsWith("millenaire:")) {
                if (this.currentLocale === "en" && STOCKPILE_FR_TO_EN[fallbackName]) {
                    return STOCKPILE_FR_TO_EN[fallbackName];
                }
                if (this.currentLocale === "fr" && STOCKPILE_EN_TO_FR[fallbackName]) {
                    return STOCKPILE_EN_TO_FR[fallbackName];
                }
                return fallbackName;
            }
            const clean = itemId.replace(/^[a-z0-9_-]+:/, "").replace(/_/g, " ");
            return clean.charAt(0).toUpperCase() + clean.slice(1);
        }
    }

    function resolveVillageLore(village) {
        const i18n = window.millenaireI18n;
        if (!village) {
            return {
                title: i18n.t("panel.millenaire.section.community", "Communauté Villageoise"),
                icon: "🏘️",
                desc: i18n.t("panel.millenaire.lore.community_desc", "Un village Millénaire autonome doté de son propre modèle économique, de ses artisans et de ses lois coutumières."),
                specialty: i18n.t("panel.millenaire.lore.community_specialty", "Économie locale • Urbanisme dynamique • Diplomatie")
            };
        }

        const isLone = Boolean(village.is_lone_building);
        const cult = (village.culture || "").replace(/^millenaire:/, "");
        const rawType = (village.village_type || "").replace(/^millenaire:/, "");
        const cleanType = rawType.includes("/") ? rawType.split("/")[1] : rawType;

        const typeKey = village.village_type_key || `villagetype.millenaire.${cult}.${cleanType}`;
        const loreKey = village.village_type_lore_key || `travelbook.millenaire.${cult}.village.${cleanType}.desc`;
        const cultureKey = village.culture_key || `culture.millenaire.${cult}`;

        const defaultTitle = isLone
            ? i18n.t("panel.millenaire.badge.lone_building", "Bâtiment Isolé")
            : i18n.t("panel.millenaire.section.community", "Communauté Villageoise");
        const title = i18n.t(typeKey, village.village_type_name || defaultTitle);

        const defaultDesc = isLone
            ? i18n.t("panel.millenaire.lore.lone_building_desc", "Un avant-poste indépendant ou une demeure autonome vivant en autarcie dans la nature sans gouvernance de village.")
            : i18n.t("panel.millenaire.lore.community_desc", "Un village Millénaire autonome doté de son propre modèle économique, de ses artisans et de ses lois coutumières.");
        const desc = i18n.t(loreKey, defaultDesc);

        const cultName = i18n.t(cultureKey, village.culture_name || cult);
        const specialty = isLone
            ? i18n.t("panel.millenaire.lore.lone_specialty", "Autarcie • Commerce autonome • Présence locale")
            : (cultName ? `${cultName} • ${title}` : i18n.t("panel.millenaire.lore.community_specialty", "Économie locale • Urbanisme dynamique • Diplomatie"));

        const icon = getVillageTypeIcon(cleanType, cult, isLone);

        return { title, desc, specialty, icon };
    }

    function resolveBuildingLore(planId, name, planKey) {
        const p = (planId || "").toLowerCase();
        const n = (name || "").toLowerCase();
        const i18n = window.millenaireI18n;

        let matchedCat = null;
        for (const b of BUILDING_CATEGORIES) {
            if (b.test(p, n)) {
                matchedCat = b;
                break;
            }
        }

        const fallbackTitle = matchedCat ? i18n.t(matchedCat.titleKey, matchedCat.fallbackTitle) : i18n.t("panel.millenaire.bld.generic.title", "Bâtiment Communautaire");
        const title = planKey ? i18n.t(planKey, name || fallbackTitle) : (name || fallbackTitle);

        let desc = "";
        if (planKey && planKey.startsWith("building.millenaire.")) {
            const tbKey = planKey.replace("building.millenaire.", "travelbook.millenaire.") + ".desc";
            if (i18n.has(tbKey)) {
                desc = i18n.t(tbKey);
            }
        }

        if (!desc && matchedCat) {
            desc = i18n.t(matchedCat.descKey, matchedCat.fallbackDesc);
        }
        if (!desc) {
            desc = i18n.t("panel.millenaire.bld.generic.desc", "Structure villageoise établie contribuant à l'essor, à l'organisation ou au patrimoine de la communauté locale.");
        }

        const role = matchedCat
            ? i18n.t(matchedCat.roleKey, matchedCat.fallbackRole)
            : i18n.t("panel.millenaire.bld.generic.role", "Infrastructure du village");

        const icon = matchedCat ? matchedCat.icon : "🏛️";

        return { title, desc, role, icon };
    }

    class MillenairePanelController {
        constructor(i18n) {
            this.i18n = i18n || window.millenaireI18n;
            this.activeVillageId = null;
            this.currentVillage = null;
            this.detailsData = null;
            this.container = null;
            this.launcherBtn = null;
            this.directoryModal = null;
            this.tooltipEl = null;
            this.filterMode = "all";
            this.searchQuery = "";
            this.pollTimer = null;
            this.isFetching = false;
            this.lastVillageSnapshot = null;
            this.sectionStates = new Map();

            this.initDOM();
            this.initTooltip();
            this.bindEvents();
            this.fetchDetails(false);
            this.startAutoRefresh();
        }

        initDOM() {
            // 1. Control-bar button to open the Millénaire Village Directory
            this.launcherBtn = document.createElement("button");
            this.launcherBtn.id = "millenaire-launcher-btn";
            this.launcherBtn.className = "millenaire-launcher-btn";
            this.launcherBtn.title = this.i18n.t("panel.millenaire.directory.toggle_button", "Afficher l'annuaire des villages Millénaire");
            this.launcherBtn.setAttribute("type", "button");
            this.launcherBtn.setAttribute("aria-label", this.i18n.t("panel.millenaire.directory.title", "Annuaire des villages Millénaire"));
            this.launcherBtn.innerHTML = `
                <span class="launcher-icon" aria-hidden="true">🏰</span>
                <span class="launcher-label">${escapeHtml(this.i18n.t("panel.millenaire.directory.villages_tab", "Villages"))}</span>
                <span id="millenaire-village-count" class="launcher-count">…</span>
            `;
            
            this.mountIntoControlBar();

            // 2. Directory Drawer
            this.directoryModal = document.createElement("div");
            this.directoryModal.id = "millenaire-directory-panel";
            this.directoryModal.className = "millenaire-directory hidden";
            this.directoryModal.setAttribute("role", "dialog");
            this.directoryModal.setAttribute("aria-label", this.i18n.t("panel.millenaire.directory.title", "Annuaire des villages Millénaire"));
            this.directoryModal.innerHTML = `
                <div class="dir-header">
                    <div class="dir-title-row">
                        <span class="dir-title">🏰 ${escapeHtml(this.i18n.t("panel.millenaire.directory.title", "Annuaire des Villages Millénaire"))}</span>
                        <div class="dir-title-actions">
                            <select class="mil-lang-select" aria-label="${escapeHtml(this.i18n.t("panel.millenaire.lang_selector_aria", "Choisir la langue / Select language"))}">
                                <option value="fr"${this.i18n.currentLocale === "fr" ? " selected" : ""}>🇫🇷 FR</option>
                                <option value="en"${this.i18n.currentLocale === "en" ? " selected" : ""}>🇬🇧 EN</option>
                            </select>
                            <button id="dir-close-btn" class="close-btn" type="button" title="${escapeHtml(this.i18n.t("panel.millenaire.button.close", "Fermer"))}" aria-label="${escapeHtml(this.i18n.t("panel.millenaire.button.close_directory", "Fermer l'annuaire"))}">✕</button>
                        </div>
                    </div>
                    <div class="dir-controls">
                        <input type="text" id="dir-search-input" class="dir-search" placeholder="${escapeHtml(this.i18n.t("panel.millenaire.directory.search_placeholder", "Rechercher un village ou une culture..."))}" aria-label="${escapeHtml(this.i18n.t("panel.millenaire.directory.search_label", "Recherche"))}" />
                        <div class="dir-filters" role="group" aria-label="Filtrer par type">
                            <button class="filter-chip active" type="button" data-filter="all">${escapeHtml(this.i18n.t("panel.millenaire.directory.filter_all", "Tous"))}</button>
                            <button class="filter-chip" type="button" data-filter="villages">${escapeHtml(this.i18n.t("panel.millenaire.directory.filter_villages", "Villages"))}</button>
                            <button class="filter-chip" type="button" data-filter="lone">${escapeHtml(this.i18n.t("panel.millenaire.directory.filter_lone", "Isolés"))}</button>
                        </div>
                    </div>
                </div>
                <div id="dir-village-list" class="dir-body" role="list"></div>
            `;
            document.body.appendChild(this.directoryModal);

            // 3. Detailed Village Side Panel
            this.container = document.createElement("div");
            this.container.id = "millenaire-side-panel";
            this.container.className = "millenaire-panel hidden";
            this.container.setAttribute("role", "region");
            this.container.setAttribute("aria-label", this.i18n.t("panel.millenaire.panel_details_aria", "Détails du village Millénaire"));
            this.container.innerHTML = `
                <div class="panel-header">
                    <div class="title-row">
                        <span id="panel-crest" class="culture-crest" aria-hidden="true">🏛️</span>
                        <h2 id="panel-village-name">${escapeHtml(this.i18n.t("millenaire.bridge.ui.unknown_village", "Nom du Village"))}</h2>
                        <select class="mil-lang-select" aria-label="${escapeHtml(this.i18n.t("panel.millenaire.lang_selector_aria", "Choisir la langue / Select language"))}">
                            <option value="fr"${this.i18n.currentLocale === "fr" ? " selected" : ""}>🇫🇷 FR</option>
                            <option value="en"${this.i18n.currentLocale === "en" ? " selected" : ""}>🇬🇧 EN</option>
                        </select>
                        <button id="panel-list-btn" class="icon-btn" type="button" title="${escapeHtml(this.i18n.t("panel.millenaire.button.back_to_directory", "Retour à l'annuaire"))}" aria-label="${escapeHtml(this.i18n.t("panel.millenaire.button.back_to_list", "Retour à la liste des villages"))}">📋</button>
                        <button id="panel-close-btn" class="close-btn" type="button" title="${escapeHtml(this.i18n.t("panel.millenaire.button.close_panel", "Fermer le panneau"))}" aria-label="${escapeHtml(this.i18n.t("panel.millenaire.button.close_panel", "Fermer le panneau"))}">✕</button>
                    </div>
                    <div class="sub-row">
                        <span id="panel-culture" class="badge">${escapeHtml(this.i18n.t("millenaire.bridge.ui.unknown_culture", "Culture"))}</span>
                        <button type="button" id="panel-type" class="type-pill has-tooltip" title="${escapeHtml(this.i18n.t("panel.millenaire.type_pill_title", "Cliquer ou survoler pour la description"))}">${escapeHtml(this.i18n.t("panel.millenaire.section.community", "Village"))} <span class="tip-icon">ℹ️</span></button>
                        <span id="panel-coords" class="coords" title="${escapeHtml(this.i18n.t("panel.millenaire.coords_title", "Coordonnées du centre"))}">X: 0, Y: 0, Z: 0</span>
                        <button id="panel-focus-btn" class="focus-btn" type="button" title="${escapeHtml(this.i18n.t("panel.millenaire.focus_btn_title", "Centrer la vue 3D"))}">📍 ${escapeHtml(this.i18n.t("panel.millenaire.focus_btn_text", "Centrer"))}</button>
                    </div>
                    <div id="panel-QuickStats" class="quick-stats-bar"></div>
                </div>
                <div class="panel-tabs" role="tablist">
                    <button class="tab-btn active" role="tab" aria-selected="true" data-tab="census">${escapeHtml(this.i18n.t("panel.millenaire.tab.population", "👥 Population"))}</button>
                    <button class="tab-btn" role="tab" aria-selected="false" data-tab="economy">${escapeHtml(this.i18n.t("panel.millenaire.tab.economy", "📦 Économie & Travaux"))}</button>
                    <button class="tab-btn" role="tab" aria-selected="false" data-tab="diplomacy">${escapeHtml(this.i18n.t("panel.millenaire.tab.diplomacy", "🤝 Diplomatie"))}</button>
                </div>
                <div class="panel-body">
                    <div id="tab-census" class="tab-content active" role="tabpanel"></div>
                    <div id="tab-economy" class="tab-content" role="tabpanel"></div>
                    <div id="tab-diplomacy" class="tab-content" role="tabpanel"></div>
                </div>
                <div class="panel-footer">
                    <span id="panel-timestamp">${escapeHtml(this.i18n.t("panel.millenaire.sync_realtime", "Synchronisation en temps réel"))}</span>
                </div>
            `;
            document.body.appendChild(this.container);
        }

        initTooltip() {
            this.tooltipEl = document.createElement("div");
            this.tooltipEl.id = "millenaire-tooltip";
            this.tooltipEl.className = "mil-tooltip";
            this.tooltipEl.setAttribute("role", "tooltip");
            this.tooltipEl.setAttribute("aria-hidden", "true");
            this.tooltipEl.innerHTML = `
                <div class="mil-tooltip-header">
                    <span class="mil-tooltip-icon">ℹ️</span>
                    <span class="mil-tooltip-title">${escapeHtml(this.i18n.t("panel.millenaire.tooltip.title", "Titre"))}</span>
                </div>
                <div class="mil-tooltip-body">${escapeHtml(this.i18n.t("panel.millenaire.tooltip.desc", "Description"))}</div>
                <div class="mil-tooltip-footer">
                    <span class="mil-tooltip-tag">${escapeHtml(this.i18n.t("panel.millenaire.tooltip.tag", "Spécialité"))}</span>
                </div>
            `;
            document.body.appendChild(this.tooltipEl);
        }

        showTooltip(anchorEl, title, body, tag, icon = "ℹ️") {
            if (!this.tooltipEl || !anchorEl) return;
            this.tooltipEl.querySelector(".mil-tooltip-icon").textContent = icon;
            this.tooltipEl.querySelector(".mil-tooltip-title").textContent = title;
            this.tooltipEl.querySelector(".mil-tooltip-body").textContent = body;
            
            const tagEl = this.tooltipEl.querySelector(".mil-tooltip-tag");
            if (tag) {
                tagEl.textContent = tag;
                tagEl.style.display = "inline-block";
            } else {
                tagEl.style.display = "none";
            }

            const rect = anchorEl.getBoundingClientRect();
            const tipWidth = 300;
            const tipHeight = 120;

            let left = rect.left + (rect.width / 2) - (tipWidth / 2);
            let top = rect.bottom + 8;

            if (left < 10) left = 10;
            if (left + tipWidth > window.innerWidth - 10) {
                left = window.innerWidth - tipWidth - 10;
            }
            if (top + tipHeight > window.innerHeight - 10) {
                top = Math.max(10, rect.top - tipHeight - 8);
            }

            this.tooltipEl.style.left = `${Math.round(left)}px`;
            this.tooltipEl.style.top = `${Math.round(top)}px`;
            this.tooltipEl.classList.add("visible");
            this.tooltipEl.setAttribute("aria-hidden", "false");
        }

        hideTooltip() {
            if (this.tooltipEl) {
                this.tooltipEl.classList.remove("visible");
                this.tooltipEl.setAttribute("aria-hidden", "true");
            }
        }

        mountIntoControlBar(retries = 30) {
            const controlBar = document.querySelector(".control-bar");
            if (controlBar) {
                const greedySpace = controlBar.querySelector(".space.greedy");
                if (greedySpace && this.launcherBtn.parentElement !== controlBar && typeof controlBar.insertBefore === "function") {
                    controlBar.insertBefore(this.launcherBtn, greedySpace);
                    this.launcherBtn.classList.add("in-control-bar");
                    return;
                }
            }
            if (retries > 0) {
                setTimeout(() => this.mountIntoControlBar(retries - 1), 500);
            }
        }

        toggleDirectory() {
            if (this.directoryModal.classList.contains("hidden")) {
                this.openDirectory();
            } else {
                this.closeDirectory();
            }
        }

        openDirectory() {
            this.renderDirectory();
            this.directoryModal.classList.remove("hidden");
            setTimeout(() => {
                const searchInput = this.directoryModal.querySelector("#dir-search-input");
                if (searchInput) searchInput.focus();
            }, 60);
            this.fetchDetails(true);
        }

        closeDirectory() {
            this.directoryModal.classList.add("hidden");
        }

        updateStaticLabels() {
            // Update launcher button
            if (this.launcherBtn) {
                this.launcherBtn.title = this.i18n.t("panel.millenaire.directory.toggle_button", "Afficher l'annuaire des villages Millénaire");
                this.launcherBtn.setAttribute("aria-label", this.i18n.t("panel.millenaire.directory.title", "Annuaire des villages Millénaire"));
                const label = this.launcherBtn.querySelector(".launcher-label");
                if (label) label.textContent = this.i18n.t("panel.millenaire.directory.villages_tab", "Villages");
            }

            // Update directory drawer
            if (this.directoryModal) {
                this.directoryModal.setAttribute("aria-label", this.i18n.t("panel.millenaire.directory.title", "Annuaire des villages Millénaire"));
                const dirTitle = this.directoryModal.querySelector(".dir-title");
                if (dirTitle) dirTitle.textContent = "🏰 " + this.i18n.t("panel.millenaire.directory.title", "Annuaire des Villages Millénaire");
                const dirClose = this.directoryModal.querySelector("#dir-close-btn");
                if (dirClose) {
                    dirClose.title = this.i18n.t("panel.millenaire.button.close", "Fermer");
                    dirClose.setAttribute("aria-label", this.i18n.t("panel.millenaire.button.close_directory", "Fermer l'annuaire"));
                }
                const searchInput = this.directoryModal.querySelector("#dir-search-input");
                if (searchInput) {
                    searchInput.placeholder = this.i18n.t("panel.millenaire.directory.search_placeholder", "Rechercher un village ou une culture...");
                    searchInput.setAttribute("aria-label", this.i18n.t("panel.millenaire.directory.search_label", "Recherche"));
                }
                const chipAll = this.directoryModal.querySelector('[data-filter="all"]');
                if (chipAll) chipAll.textContent = this.i18n.t("panel.millenaire.directory.filter_all", "Tous");
                const chipVillages = this.directoryModal.querySelector('[data-filter="villages"]');
                if (chipVillages) chipVillages.textContent = this.i18n.t("panel.millenaire.directory.filter_villages", "Villages");
                const chipLone = this.directoryModal.querySelector('[data-filter="lone"]');
                if (chipLone) chipLone.textContent = this.i18n.t("panel.millenaire.directory.filter_lone", "Isolés");
            }

            // Update side panel
            if (this.container) {
                this.container.setAttribute("aria-label", this.i18n.t("panel.millenaire.panel_details_aria", "Détails du village Millénaire"));
                const listBtn = this.container.querySelector("#panel-list-btn");
                if (listBtn) {
                    listBtn.title = this.i18n.t("panel.millenaire.button.back_to_directory", "Retour à l'annuaire");
                    listBtn.setAttribute("aria-label", this.i18n.t("panel.millenaire.button.back_to_list", "Retour à la liste des villages"));
                }
                const panelClose = this.container.querySelector("#panel-close-btn");
                if (panelClose) {
                    panelClose.title = this.i18n.t("panel.millenaire.button.close_panel", "Fermer le panneau");
                    panelClose.setAttribute("aria-label", this.i18n.t("panel.millenaire.button.close_panel", "Fermer le panneau"));
                }
                const focusBtn = this.container.querySelector("#panel-focus-btn");
                if (focusBtn) {
                    focusBtn.title = this.i18n.t("panel.millenaire.focus_btn_title", "Centrer la vue 3D");
                    focusBtn.textContent = "📍 " + this.i18n.t("panel.millenaire.focus_btn_text", "Centrer");
                }
                const tabCensus = this.container.querySelector('[data-tab="census"]');
                if (tabCensus) tabCensus.textContent = this.i18n.t("panel.millenaire.tab.population", "👥 Population");
                const tabEcon = this.container.querySelector('[data-tab="economy"]');
                if (tabEcon) tabEcon.textContent = this.i18n.t("panel.millenaire.tab.economy", "📦 Économie & Travaux");
                const tabDiplo = this.container.querySelector('[data-tab="diplomacy"]');
                if (tabDiplo) tabDiplo.textContent = this.i18n.t("panel.millenaire.tab.diplomacy", "🤝 Diplomatie");
            }

            // Synchronize all language selector selects
            document.querySelectorAll(".mil-lang-select").forEach(sel => {
                sel.value = this.i18n.currentLocale;
            });

            // Trigger reactive re-renders immediately without page reload
            if (!this.directoryModal.classList.contains("hidden") || this.detailsData) {
                this.renderDirectory();
            }
            if (this.currentVillage && !this.container.classList.contains("hidden")) {
                this.lastVillageSnapshot = null;
                this.render(this.currentVillage, false);
            }
            this.hideTooltip();
        }

        bindEvents() {
            // Direct click on button
            this.launcherBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.toggleDirectory();
            });

            // Delegated global click for launcher button
            document.addEventListener("click", (evt) => {
                const btn = evt.target.closest("#millenaire-launcher-btn, .millenaire-launcher-btn");
                if (btn) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    this.toggleDirectory();
                    return;
                }

                if (!evt.target.closest(".has-tooltip, #millenaire-tooltip")) {
                    this.hideTooltip();
                }
            });

            // Global Escape key handling
            document.addEventListener("keydown", (evt) => {
                if (evt.key === "Escape") {
                    if (this.tooltipEl && this.tooltipEl.classList.contains("visible")) {
                        this.hideTooltip();
                        return;
                    }
                    if (this.directoryModal && !this.directoryModal.classList.contains("hidden")) {
                        this.closeDirectory();
                        return;
                    }
                    if (this.container && !this.container.classList.contains("hidden")) {
                        this.close();
                        return;
                    }
                }
            });

            const dirClose = this.directoryModal.querySelector("#dir-close-btn");
            if (dirClose) dirClose.addEventListener("click", () => this.closeDirectory());

            const dirSearch = this.directoryModal.querySelector("#dir-search-input");
            if (dirSearch) dirSearch.addEventListener("input", (e) => {
                this.searchQuery = (e.target.value || "").trim().toLowerCase();
                this.renderDirectory();
            });

            this.directoryModal.querySelectorAll(".filter-chip").forEach(chip => {
                chip.addEventListener("click", () => {
                    this.directoryModal.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
                    chip.classList.add("active");
                    this.filterMode = chip.dataset.filter || "all";
                    this.renderDirectory();
                });
            });

            const panelClose = this.container.querySelector("#panel-close-btn");
            if (panelClose) panelClose.addEventListener("click", () => this.close());

            const panelList = this.container.querySelector("#panel-list-btn");
            if (panelList) panelList.addEventListener("click", () => {
                this.openDirectory();
            });

            this.container.querySelectorAll(".tab-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    this.switchTab(btn.dataset.tab);
                });
            });

            const panelFocus = this.container.querySelector("#panel-focus-btn");
            if (panelFocus) panelFocus.addEventListener("click", () => {
                if (this.currentVillage) {
                    const c = this.currentVillage.center;
                    this.focusCamera(c?.x ?? 0, c?.y ?? 64, c?.z ?? 0);
                }
            });

            // Village Type Header Tooltip Trigger
            const panelTypeBtn = this.container.querySelector("#panel-type");
            if (panelTypeBtn) {
                const showVillageTypeTip = () => {
                    if (!this.currentVillage) return;
                    const lore = resolveVillageLore(this.currentVillage);
                    this.showTooltip(panelTypeBtn, lore.title, lore.desc, lore.specialty, lore.icon);
                };

                panelTypeBtn.addEventListener("mouseenter", showVillageTypeTip);
                panelTypeBtn.addEventListener("mouseleave", () => this.hideTooltip());
                panelTypeBtn.addEventListener("focus", showVillageTypeTip);
                panelTypeBtn.addEventListener("blur", () => this.hideTooltip());
                panelTypeBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (this.tooltipEl && this.tooltipEl.classList.contains("visible")) {
                        this.hideTooltip();
                    } else {
                        showVillageTypeTip();
                    }
                });
            }

            // Delegate tooltips on buildings
            document.addEventListener("mouseover", (evt) => {
                const bldEl = evt.target.closest(".bld-clickable.has-tooltip");
                if (bldEl) {
                    const planId = bldEl.dataset.bldPlan || "";
                    const planKey = bldEl.dataset.bldPlanKey || "";
                    const name = bldEl.dataset.bldName || "";
                    const lore = resolveBuildingLore(planId, name, planKey);
                    this.showTooltip(bldEl, lore.title, lore.desc, lore.role, lore.icon);
                }
            });

            document.addEventListener("mouseout", (evt) => {
                if (evt.target.closest(".bld-clickable.has-tooltip")) {
                    this.hideTooltip();
                }
            });

            // Delegate clicks from CSS2D HTML badges
            document.addEventListener("click", (evt) => {
                const badge = evt.target.closest(".millenaire-village-badge, .millenaire-marker-badge");
                if (badge && badge.dataset.villageId) {
                    evt.stopPropagation();
                    this.openVillage(badge.dataset.villageId);
                    return;
                }
                const diploBadge = evt.target.closest(".millenaire-diplo-badge");
                if (diploBadge && diploBadge.dataset.sourceId) {
                    evt.stopPropagation();
                    const src = diploBadge.dataset.sourceId;
                    const tgt = diploBadge.dataset.targetId;
                    const chosen = (this.activeVillageId === src && tgt) ? tgt : src;
                    this.openVillage(chosen, "diplomacy");
                }
            });

            // Monitor state changes on details sections
            this.container.addEventListener("toggle", (evt) => {
                if (evt.target && evt.target.matches("details.panel-section")) {
                    const secId = evt.target.id;
                    if (secId) {
                        this.sectionStates.set(secId, evt.target.open);
                    }
                }
            }, true);

            // Bind change on all language selects
            document.addEventListener("change", (e) => {
                const sel = e.target.closest(".mil-lang-select");
                if (sel) {
                    const chosen = sel.value;
                    this.i18n.setLocale(chosen);
                }
            });

            // React to i18n locale change
            this.i18n.onLocaleChanged(() => {
                this.updateStaticLabels();
            });

            this.installObjectMarkerInterceptor();
        }

        switchTab(tabName) {
            this.container.querySelectorAll(".tab-btn").forEach(b => {
                const isActive = b.dataset.tab === tabName;
                b.classList.toggle("active", isActive);
                b.setAttribute("aria-selected", isActive ? "true" : "false");
            });
            this.container.querySelectorAll(".tab-content").forEach(c => {
                c.classList.toggle("active", c.id === "tab-" + tabName);
            });
        }

        focusCamera(x, y, z) {
            if (window.bluemap && window.bluemap.mapViewer && window.bluemap.mapViewer.controlsManager) {
                const cm = window.bluemap.mapViewer.controlsManager;
                const pos = cm.position;
                if (pos && typeof pos.set === "function") {
                    pos.set(Number(x) || 0, Number(y) || 64, Number(z) || 0);
                }
                if (typeof cm.distance === "number" && cm.distance > 160) {
                    cm.distance = 160;
                }
            }
        }

        installObjectMarkerInterceptor(retries = 30) {
            if (!window.BlueMap || !window.BlueMap.ObjectMarker) {
                if (retries > 0) {
                    setTimeout(() => this.installObjectMarkerInterceptor(retries - 1), 200);
                }
                return;
            }
            const self = this;
            const originalOnClick = window.BlueMap.ObjectMarker.prototype.onClick;
            window.BlueMap.ObjectMarker.prototype.onClick = function (event) {
                if (event && event.data && event.data.doubleTap) {
                    return false;
                }

                const markerId = this.data?.id || "";
                if (markerId.startsWith("zone_")) {
                    const villageId = markerId.replace("zone_", "");
                    self.openVillage(villageId);
                    return true;
                }
                if (markerId.startsWith("rel_")) {
                    const parts = markerId.split("_");
                    if (parts.length >= 3) {
                        const villageA = parts[1];
                        const villageB = parts[2];
                        const targetId = (self.activeVillageId === villageA) ? villageB : villageA;
                        self.openVillage(targetId, "diplomacy");
                        return true;
                    }
                }
                if (typeof originalOnClick === "function") {
                    return originalOnClick.call(this, event);
                }
                return false;
            };
        }

        startAutoRefresh() {
            if (this.pollTimer) clearTimeout(this.pollTimer);
            const refreshCycle = async () => {
                const isPanelOpen = !this.container.classList.contains("hidden");
                const isDirOpen = !this.directoryModal.classList.contains("hidden");
                if (isPanelOpen || isDirOpen) {
                    await this.fetchDetails(true);
                }
                this.pollTimer = setTimeout(refreshCycle, 5000);
            };
            this.pollTimer = setTimeout(refreshCycle, 5000);
        }

        async fetchDetails(silent = false) {
            if (this.isFetching) return this.detailsData;
            this.isFetching = true;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            try {
                const res = await fetch("data/millenaire_details.json?t=" + Date.now(), { signal: controller.signal });
                clearTimeout(timeoutId);
                if (!res.ok) return null;
                this.detailsData = await res.json();
                const villages = this.detailsData?.villages ?? [];
                const countEl = (this.launcherBtn && this.launcherBtn.querySelector("#millenaire-village-count")) || (document.getElementById ? document.getElementById("millenaire-village-count") : null);
                if (countEl) {
                    countEl.textContent = String(villages.length);
                }
                if (!this.directoryModal.classList.contains("hidden")) {
                    this.renderDirectory();
                }
                if (this.activeVillageId && !this.container.classList.contains("hidden")) {
                    const v = villages.find(item => item.id === this.activeVillageId);
                    if (v) {
                        this.render(v, true);
                    }
                }
                return this.detailsData;
            } catch (err) {
                clearTimeout(timeoutId);
                if (!silent && err.name !== "AbortError") {
                    console.error("Failed to load Millénaire details:", err);
                }
                return null;
            } finally {
                this.isFetching = false;
            }
        }

        renderDirectory() {
            const listEl = this.directoryModal ? this.directoryModal.querySelector("#dir-village-list") : (document.getElementById ? document.getElementById("dir-village-list") : null);
            if (!listEl) return;
            const villages = (this.detailsData?.villages ?? []).slice();

            const filtered = villages.filter(v => {
                const isLone = Boolean(v.is_lone_building);
                if (this.filterMode === "villages" && isLone) return false;
                if (this.filterMode === "lone" && !isLone) return false;
                if (this.searchQuery) {
                    const nameMatch = (v.name ?? "").toLowerCase().includes(this.searchQuery);
                    const cultLocal = this.i18n.t(v.culture_key, v.culture_name ?? v.culture).toLowerCase();
                    const cultRaw = (v.culture_name ?? v.culture ?? "").toLowerCase();
                    const typeLocal = this.i18n.t(v.village_type_key, v.village_type_name ?? v.village_type).toLowerCase();
                    const typeRaw = (v.village_type_name ?? v.village_type ?? "").toLowerCase();
                    return nameMatch || cultLocal.includes(this.searchQuery) || cultRaw.includes(this.searchQuery) || typeLocal.includes(this.searchQuery) || typeRaw.includes(this.searchQuery);
                }
                return true;
            });

            filtered.sort((a, b) => {
                const loneA = a.is_lone_building ? 1 : 0;
                const loneB = b.is_lone_building ? 1 : 0;
                if (loneA !== loneB) return loneA - loneB;
                const popDiff = (b.population?.total ?? 0) - (a.population?.total ?? 0);
                if (popDiff !== 0) return popDiff;
                return (a.name ?? "").localeCompare(b.name ?? "", this.i18n.currentLocale);
            });

            if (filtered.length === 0) {
                listEl.innerHTML = `<div class="empty-state">${escapeHtml(this.i18n.t("panel.millenaire.directory.empty", "Aucun village correspondant trouvé."))}</div>`;
                return;
            }

            const currentScroll = listEl.scrollTop;

            listEl.innerHTML = filtered.map(v => {
                const icon = getCultureIcon(v.culture);
                const color = sanitizeHexColor(getCultureColor(v.culture));
                const pop = v.population?.total ?? 0;
                const bldCount = v.buildings_count ?? (v.buildings_list?.length ?? 0);
                const relCount = (v.relations ?? []).length;
                const cx = v.center?.x ?? 0;
                const cy = v.center?.y ?? 64;
                const cz = v.center?.z ?? 0;
                const isSelected = v.id === this.activeVillageId;

                const villageName = v.name ?? this.i18n.t("millenaire.bridge.ui.unknown_village", "Village");
                const cultName = this.i18n.t(v.culture_key, v.culture_name ?? v.culture);
                const habLabel = this.i18n.t("panel.millenaire.stat.inhabitants_short", "hab.");
                const bldLabel = this.i18n.t("panel.millenaire.stat.buildings_short", "bât.");
                const relLabel = this.i18n.t("panel.millenaire.stat.relations_short", "rel.");
                const gotoTitle = this.i18n.t("panel.millenaire.directory.goto_title", "Centrer et inspecter");

                return `
                    <div class="dir-item ${isSelected ? "selected" : ""}" data-village-id="${escapeHtml(v.id)}" role="button" tabindex="0">
                        <div class="dir-item-crest" style="background: ${color}22; border-color: ${color}">${icon}</div>
                        <div class="dir-item-main">
                            <div class="dir-item-top">
                                <span class="dir-item-name">${escapeHtml(villageName)}</span>
                                <span class="dir-item-culture" style="background: ${color}">${escapeHtml(cultName)}</span>
                            </div>
                            <div class="dir-item-meta">
                                <span>👤 ${pop} ${escapeHtml(habLabel)}</span>
                                <span>🏛️ ${bldCount} ${escapeHtml(bldLabel)}</span>
                                ${relCount > 0 ? `<span>🤝 ${relCount} ${escapeHtml(relLabel)}</span>` : ""}
                                <span class="dir-coords tabular-num">[${cx}, ${cy}, ${cz}]</span>
                            </div>
                        </div>
                        <span class="dir-goto-btn" aria-hidden="true" title="${escapeHtml(gotoTitle)}">📍</span>
                    </div>
                `;
            }).join("");

            if (currentScroll > 0) {
                listEl.scrollTop = currentScroll;
            }

            const selectHandler = (row) => {
                const vid = row.dataset.villageId;
                if (!vid) return;
                const village = (this.detailsData?.villages ?? []).find(v => v.id === vid);
                if (village) {
                    this.focusCamera(village.center?.x ?? 0, village.center?.y ?? 64, village.center?.z ?? 0);
                }
                this.closeDirectory();
                this.openVillage(vid);
            };

            listEl.querySelectorAll(".dir-item").forEach(row => {
                row.addEventListener("click", () => selectHandler(row));
                row.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectHandler(row);
                    }
                });
            });
        }

        async openVillage(villageId, tabToActivate = null) {
            this.activeVillageId = villageId;
            try {
                await this.fetchDetails(true);
                const village = this.detailsData?.villages?.find(v => v.id === villageId);
                if (village) {
                    this.render(village, false);
                    if (tabToActivate) {
                        this.switchTab(tabToActivate);
                    }
                    this.container.classList.remove("hidden");
                    if (!this.directoryModal.classList.contains("hidden")) {
                        this.renderDirectory();
                    }
                }
            } catch (err) {
                console.error("Failed to open Millénaire village:", err);
            }
        }

        close() {
            this.container.classList.add("hidden");
            this.activeVillageId = null;
            this.lastVillageSnapshot = null;
            this.hideTooltip();
            if (!this.directoryModal.classList.contains("hidden")) {
                this.renderDirectory();
            }
        }

        buildSection(id, icon, title, countBadge, contentHtml, defaultOpen = true) {
            const isCurrentlyOpen = this.sectionStates.has(id) ? this.sectionStates.get(id) : defaultOpen;
            return `
                <details class="panel-section" id="${escapeHtml(id)}" ${isCurrentlyOpen ? "open" : ""}>
                    <summary class="section-summary">
                        <span class="section-title-wrap">
                            <span class="section-icon" aria-hidden="true">${icon}</span>
                            <span class="section-title">${escapeHtml(title)}</span>
                            ${countBadge !== null && countBadge !== undefined ? `<span class="section-count-badge tabular-num">${countBadge}</span>` : ""}
                        </span>
                        <span class="section-chevron" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </span>
                    </summary>
                    <div class="section-content">
                        ${contentHtml}
                    </div>
                </details>
            `;
        }

        render(v, isSilentUpdate = false) {
            const snapshotKey = JSON.stringify({
                id: v.id,
                name: v.name,
                locale: this.i18n.currentLocale,
                pop: v.population?.total,
                men: v.population?.men,
                women: v.population?.women,
                children: v.population?.children,
                rosterLen: v.population?.roster?.length,
                gold: v.stockpiles?.deniers?.gold,
                silver: v.stockpiles?.deniers?.silver,
                copper: v.stockpiles?.deniers?.copper,
                projects: v.projects,
                buildingsLen: v.buildings_list?.length,
                relationsLen: v.relations?.length,
                underAttack: v.military?.is_under_attack,
                raidTarget: v.military?.active_raid_target
            });

            if (isSilentUpdate && this.lastVillageSnapshot === snapshotKey) {
                return;
            }
            this.lastVillageSnapshot = snapshotKey;

            const activeTabContent = this.container.querySelector(".tab-content.active");
            const prevScrollTop = activeTabContent ? activeTabContent.scrollTop : 0;

            this.currentVillage = v;
            const cultureColor = sanitizeHexColor(getCultureColor(v.culture));
            const crestEl = this.container.querySelector("#panel-crest");
            if (crestEl) {
                crestEl.textContent = getCultureIcon(v.culture);
            }

            this.container.querySelector("#panel-village-name").textContent = v.name ?? this.i18n.t("millenaire.bridge.ui.unknown_village", "Village Inconnu");

            const cultBadge = this.container.querySelector("#panel-culture");
            const cultName = this.i18n.t(v.culture_key, v.culture_name ?? (v.culture ?? this.i18n.t("millenaire.bridge.ui.unknown_culture", "Inconnu")));
            cultBadge.textContent = cultName;
            cultBadge.style.background = cultureColor;

            const typeBadge = this.container.querySelector("#panel-type");
            const typeFallback = v.is_lone_building ? this.i18n.t("panel.millenaire.badge.lone_building", "Bâtiment isolé") : this.i18n.t("panel.millenaire.section.community", "Village");
            const typeLabel = this.i18n.t(v.village_type_key, v.village_type_name || typeFallback);
            typeBadge.innerHTML = `${escapeHtml(typeLabel)} <span class="tip-icon" aria-hidden="true">ℹ️</span>`;
            typeBadge.title = this.i18n.t("panel.millenaire.type_pill_title", "Cliquer ou survoler pour la description");

            const cx = v.center?.x ?? 0;
            const cy = v.center?.y ?? 0;
            const cz = v.center?.z ?? 0;
            this.container.querySelector("#panel-coords").textContent = `X: ${cx}, Y: ${cy}, Z: ${cz}`;
            this.container.querySelector("#panel-coords").title = this.i18n.t("panel.millenaire.coords_title", "Coordonnées du centre");

            // Quick stats bar
            const defRating = v.military?.defense_rating ?? 0;
            const raidStrength = v.military?.raid_strength ?? 0;
            const underAttack = Boolean(v.military?.is_under_attack);
            const raidTarget = v.military?.active_raid_target;
            const bldCount = v.buildings_count ?? (v.buildings_list?.length ?? 0);
            const quickBar = this.container.querySelector("#panel-QuickStats");
            if (quickBar) {
                let statusHtml = "";
                if (underAttack) {
                    statusHtml = `<span class="qstat qstat-alert">${escapeHtml(this.i18n.t("panel.millenaire.badge.under_attack", "🔥 Sous attaque !"))}</span>`;
                } else if (raidTarget) {
                    const raidTitle = this.i18n.t("panel.millenaire.badge.active_raid_target", "Raid en cours contre {target}", { target: raidTarget });
                    const raidText = this.i18n.t("panel.millenaire.badge.raiding_to", "⚔️ En raid → {target}", { target: raidTarget });
                    statusHtml = `<span class="qstat qstat-raid" title="${escapeHtml(raidTitle)}">${escapeHtml(raidText)}</span>`;
                } else {
                    statusHtml = `<span class="qstat qstat-peace">${escapeHtml(this.i18n.t("panel.millenaire.badge.peaceful", "🕊️ Paisible"))}</span>`;
                }

                const defTitle = this.i18n.t("panel.millenaire.stat.defense_title", "Force défensive");
                const defLabel = this.i18n.t("panel.millenaire.stat.defense_short", "Déf: ");
                const raidTitle = this.i18n.t("panel.millenaire.stat.raid_strength_title", "Force de raid");
                const raidLabel = this.i18n.t("panel.millenaire.stat.raid_short", "Raid: ");
                const bldTitle = this.i18n.t("panel.millenaire.stat.buildings_count", "Nombre de bâtiments");
                const bldLabel = this.i18n.t("panel.millenaire.stat.buildings_short_label", "Bât: ");

                quickBar.innerHTML = `
                    ${statusHtml}
                    <span class="qstat" title="${escapeHtml(defTitle)}">🛡️ ${escapeHtml(defLabel)}<b class="tabular-num">${defRating}</b></span>
                    <span class="qstat" title="${escapeHtml(raidTitle)}">⚔️ ${escapeHtml(raidLabel)}<b class="tabular-num">${raidStrength}</b></span>
                    <span class="qstat" title="${escapeHtml(bldTitle)}">🏛️ ${escapeHtml(bldLabel)}<b class="tabular-num">${bldCount}</b></span>
                `;
            }

            // Timestamp footer
            const tsEl = this.container.querySelector("#panel-timestamp");
            if (tsEl && this.detailsData?.timestamp) {
                const localeTag = this.i18n.currentLocale === "fr" ? "fr-FR" : "en-US";
                const dateStr = new Date(this.detailsData.timestamp).toLocaleTimeString(localeTag);
                tsEl.textContent = this.i18n.t("panel.millenaire.updated_at", "Mis à jour à {time} • Monde : {world}", {
                    time: dateStr,
                    world: this.detailsData.world ?? "overworld"
                });
            }

            // 1. POPULATION TAB
            const pop = v.population ?? {};
            const roster = pop.roster ?? [];
            const census = this.container ? this.container.querySelector("#tab-census") : (document.getElementById ? document.getElementById("tab-census") : null);
            if (!census) return;

            const statGridHtml = `
                <div class="stat-grid">
                    <div class="stat-card"><span>${escapeHtml(this.i18n.t("panel.millenaire.stat.population", "Population Totale"))}</span><b class="tabular-num">${pop.total ?? 0}</b></div>
                    <div class="stat-card"><span>${escapeHtml(this.i18n.t("panel.millenaire.stat.men", "Hommes"))}</span><b class="tabular-num">${pop.men ?? 0}</b></div>
                    <div class="stat-card"><span>${escapeHtml(this.i18n.t("panel.millenaire.stat.women", "Femmes"))}</span><b class="tabular-num">${pop.women ?? 0}</b></div>
                    <div class="stat-card"><span>${escapeHtml(this.i18n.t("panel.millenaire.stat.children", "Enfants"))}</span><b class="tabular-num">${pop.children ?? 0}</b></div>
                </div>
            `;

            const unknownNameLabel = this.i18n.t("millenaire.bridge.ui.unknown_name", "Inconnu");
            const villagerFallbackRole = this.i18n.t("millenaire.bridge.ui.villager", "Villageois");
            const raidBadgeLabel = this.i18n.t("panel.millenaire.badge.raiding", "⚔️ Raid");
            const hiredBadgeLabel = this.i18n.t("panel.millenaire.badge.hired", "🤝 Embauché");
            const killedBadgeLabel = this.i18n.t("panel.millenaire.badge.killed", "💀 Décédé");

            const rosterHtml = `
                <ul class="resident-list">
                    ${roster.length === 0 ? `<li class="empty-row"><span class="resident-name">${escapeHtml(this.i18n.t("panel.millenaire.roster.no_villagers", "Aucun habitant recensé."))}</span></li>` : roster.map(r => {
                        const roleName = this.i18n.t(r.role_key, r.role || villagerFallbackRole);
                        const rName = r.name ?? unknownNameLabel;
                        const strengthTitle = this.i18n.t("panel.millenaire.military_strength_title", "Force militaire: {strength}", { strength: String(r.military_strength ?? 0) });
                        return `
                            <li>
                                <div class="resident-info">
                                    <span class="resident-name">${escapeHtml(rName)}</span>
                                    <span class="resident-sub">${escapeHtml(roleName)}${r.home_building ? ` • 🏠 ${escapeHtml(r.home_building)}` : ""}</span>
                                </div>
                                <div class="resident-badges">
                                    ${r.is_combatant ? `<span class="shield-badge tabular-num" title="${escapeHtml(strengthTitle)}">🛡️ ${escapeHtml(String(r.military_strength ?? ""))}</span>` : ""}
                                    ${r.is_raiding ? `<span class="raid-badge">${escapeHtml(raidBadgeLabel)}</span>` : ""}
                                    ${r.is_hired ? `<span class="hired-badge">${escapeHtml(hiredBadgeLabel)}</span>` : ""}
                                    ${r.is_killed ? `<span class="dead-badge">${escapeHtml(killedBadgeLabel)}</span>` : ""}
                                </div>
                            </li>
                        `;
                    }).join("")}
                </ul>
            `;

            census.innerHTML = `
                ${statGridHtml}
                ${this.buildSection("sec-roster", "👥", this.i18n.t("panel.millenaire.section.roster", "Registre des Habitants"), roster.length, rosterHtml, true)}
            `;

            // 2. ECONOMY TAB
            const gold = v.stockpiles?.deniers?.gold ?? 0;
            const silver = v.stockpiles?.deniers?.silver ?? 0;
            const copper = v.stockpiles?.deniers?.copper ?? 0;
            const wood = v.stockpiles?.resources?.wood ?? 0;
            const stone = v.stockpiles?.resources?.stone ?? 0;
            const food = v.stockpiles?.resources?.food ?? 0;
            const materialsMap = v.stockpiles?.construction_materials ?? {};
            const foodMap = v.stockpiles?.food_reserves ?? {};
            const projects = v.projects ?? [];
            const rawBuildings = v.buildings_list ?? [];

            // Group repetitive wall segments
            const groupedBuildings = [];
            const wallTypes = new Map();
            const fortLabel = this.i18n.t("panel.millenaire.buildings.fortifications", "Fortifications");
            for (const b of rawBuildings) {
                const plan = (b.plan_id || "").toLowerCase();
                const name = (b.name || "").toLowerCase();
                const isWall = plan.includes("wall") || plan.includes("segment") || plan.includes("borne") || plan.includes("path") || name.includes("muraille") || name.includes("borne") || name.includes("fortification");
                if (isWall) {
                    const bldName = this.i18n.t(b.plan_key, b.name || fortLabel);
                    const count = wallTypes.get(bldName) || { count: 0, bld: b, planKey: b.plan_key };
                    count.count++;
                    wallTypes.set(bldName, count);
                } else {
                    groupedBuildings.push({ isGroup: false, bld: b });
                }
            }
            for (const [wallName, data] of wallTypes.entries()) {
                groupedBuildings.push({ isGroup: true, name: wallName, count: data.count, bld: data.bld, planKey: data.planKey });
            }

            const materialEntries = Object.entries(materialsMap);
            const foodEntries = Object.entries(foodMap);
            const totalStockKinds = materialEntries.length + foodEntries.length;

            const goldLabel = this.i18n.t("panel.millenaire.economy.deniers_gold_short", "Or");
            const silverLabel = this.i18n.t("panel.millenaire.economy.deniers_silver_short", "Argent");
            const copperLabel = this.i18n.t("panel.millenaire.economy.deniers_copper_short", "Bronze");
            const woodLabel = this.i18n.t("panel.millenaire.economy.wood_short", "Bois");
            const stoneLabel = this.i18n.t("panel.millenaire.economy.stone_short", "Pierre");
            const foodLabel = this.i18n.t("panel.millenaire.economy.food_short", "Nourriture");

            const treasuryHtml = `
                <div class="coins-row">
                    <span class="coin-pill gold">🪙 <b class="tabular-num">${gold}</b> ${escapeHtml(goldLabel)}</span>
                    <span class="coin-pill silver">🥈 <b class="tabular-num">${silver}</b> ${escapeHtml(silverLabel)}</span>
                    <span class="coin-pill copper">🥉 <b class="tabular-num">${copper}</b> ${escapeHtml(copperLabel)}</span>
                </div>
                <div class="stat-grid stat-grid-3">
                    <div class="stat-card"><span>🪵 ${escapeHtml(woodLabel)}</span><b class="tabular-num">${wood}</b></div>
                    <div class="stat-card"><span>🪨 ${escapeHtml(stoneLabel)}</span><b class="tabular-num">${stone}</b></div>
                    <div class="stat-card"><span>🍞 ${escapeHtml(foodLabel)}</span><b class="tabular-num">${food}</b></div>
                </div>
            `;

            const projectsHtml = projects.length === 0
                ? `<p class="muted-note">${escapeHtml(this.i18n.t("panel.millenaire.project.no_projects", "Aucun chantier en cours actuellement."))}</p>`
                : `
                    <ul class="project-list">
                        ${projects.map(p => {
                            const pct = Math.round((p.progress ?? 0) * 100);
                            const reqs = p.required_resources ?? [];
                            const missingCount = reqs.filter(r => (r.available ?? 0) < (r.required ?? 0)).length;
                            const projName = p.name ?? this.i18n.t("panel.millenaire.project.default_name", "Chantier");
                            const blockedAlert = this.i18n.t("panel.millenaire.project.blocked", "⚠️ Chantier suspendu : matériaux manquants en coffres");
                            const reqTitle = this.i18n.t("panel.millenaire.project.req_title", "Matériaux requis pour l'étape :");
                            const missingTag = this.i18n.t("panel.millenaire.project.missing_count", "⚠️ {count} manquant(s)", { count: missingCount });
                            const readyTag = this.i18n.t("panel.millenaire.project.ready_tag", "✓ Approvisionné");

                            return `
                                <li class="project-card ${p.is_blocked ? 'is-blocked' : ''}">
                                    <div class="proj-header">
                                        <span class="proj-name">🏗️ <b>${escapeHtml(projName)}</b></span>
                                        <span class="proj-steps tabular-num">${pct}% (${p.current_step ?? 0}/${p.total_steps ?? 0})</span>
                                    </div>
                                    <div class="progress-bar"><div class="fill" style="width: ${pct}%"></div></div>
                                    ${p.is_blocked ? `<div class="blocked-alert">${escapeHtml(blockedAlert)}</div>` : ''}
                                    ${reqs.length > 0 ? `
                                        <div class="resource-requirements-block">
                                            <div class="req-title-row">
                                                <span>${escapeHtml(reqTitle)}</span>
                                                ${missingCount > 0
                                                    ? `<span class="req-missing-tag">${escapeHtml(missingTag)}</span>`
                                                    : `<span class="req-ready-tag">${escapeHtml(readyTag)}</span>`
                                                }
                                            </div>
                                            <div class="resource-need-grid">
                                                ${reqs.map(r => {
                                                    const reqVal = r.required ?? 0;
                                                    const availVal = r.available ?? 0;
                                                    const isReady = availVal >= reqVal;
                                                    const diff = reqVal - availVal;
                                                    const ratio = Math.min(100, Math.round((availVal / Math.max(1, reqVal)) * 100));
                                                    const itemName = this.i18n.translateItem(r.item_id, r.item_name);
                                                    const tipTitle = isReady
                                                        ? this.i18n.t("panel.millenaire.project.resource_sufficient", "Ressource suffisante en stock")
                                                        : this.i18n.t("panel.millenaire.project.resource_deficit", "Déficit de {diff} unités", { diff });

                                                    return `
                                                        <div class="resource-gauge-card ${isReady ? 'is-ready' : 'is-missing'}" title="${escapeHtml(tipTitle)}">
                                                            <div class="res-card-top">
                                                                <span class="res-card-name">${escapeHtml(itemName)}</span>
                                                                <span class="res-card-qty tabular-num">
                                                                    <b>${availVal}</b>/${reqVal}
                                                                    ${isReady ? '<span class="qty-badge-ok">✓</span>' : `<span class="qty-badge-diff">-${diff}</span>`}
                                                                </span>
                                                            </div>
                                                            <div class="res-card-track">
                                                                <div class="res-card-bar ${isReady ? 'bar-ready' : 'bar-missing'}" style="width: ${ratio}%"></div>
                                                            </div>
                                                        </div>
                                                    `;
                                                }).join("")}
                                            </div>
                                        </div>
                                    ` : ''}
                                </li>
                            `;
                        }).join("")}
                    </ul>
                `;

            const stockpilesHtml = totalStockKinds === 0
                ? `<p class="muted-note">${escapeHtml(this.i18n.t("panel.millenaire.stockpile.empty", "Aucune marchandise recensée dans les coffres."))}</p>`
                : `
                    <div class="stock-chips">
                        ${materialEntries.map(([k, val]) => {
                            const label = this.i18n.translateItem(k, k);
                            return `<span class="stock-chip">🧱 ${escapeHtml(label)}: <b class="tabular-num">${escapeHtml(String(val))}</b></span>`;
                        }).join("")}
                        ${foodEntries.map(([k, val]) => {
                            const label = this.i18n.translateItem(k, k);
                            return `<span class="stock-chip food">🍎 ${escapeHtml(label)}: <b class="tabular-num">${escapeHtml(String(val))}</b></span>`;
                        }).join("")}
                    </div>
                `;

            const defaultBldName = this.i18n.t("millenaire.bridge.ui.building", "Bâtiment");
            const focusZoneTitle = this.i18n.t("panel.millenaire.buildings.click_to_focus_zone", "Cliquer pour centrer la zone");
            const focusBldTitle = this.i18n.t("panel.millenaire.buildings.click_to_focus", "Cliquer pour centrer la caméra 3D");

            const buildingsHtml = rawBuildings.length === 0
                ? `<p class="muted-note">${escapeHtml(this.i18n.t("panel.millenaire.buildings.no_buildings", "Aucun bâtiment établi."))}</p>`
                : `
                    <ul class="building-list">
                        ${groupedBuildings.map(item => {
                            if (item.isGroup) {
                                return `
                                    <li class="bld-clickable has-tooltip" data-bld-plan="${escapeHtml(item.bld.plan_id ?? '')}" data-bld-plan-key="${escapeHtml(item.planKey ?? '')}" data-bld-name="${escapeHtml(item.name)}" data-bx="${item.bld.x ?? 0}" data-by="${item.bld.y ?? 64}" data-bz="${item.bld.z ?? 0}" role="button" tabindex="0" title="${escapeHtml(focusZoneTitle)}">
                                        <span class="bld-name">🛡️ ${escapeHtml(item.name)} <span class="group-count tabular-num">×${escapeHtml(String(item.count))}</span></span>
                                        <span class="bld-meta tabular-num">${escapeHtml(fortLabel)} • [${item.bld.x ?? 0}, ${item.bld.y ?? 0}, ${item.bld.z ?? 0}]</span>
                                    </li>
                                `;
                            }
                            const b = item.bld;
                            const bldName = this.i18n.t(b.plan_key, b.name ?? b.plan_id ?? defaultBldName);
                            const lvlLabel = this.i18n.t("millenaire.bridge.ui.level", "Niv. {level}", { level: b.level ?? 0 });
                            return `
                                <li class="bld-clickable has-tooltip" data-bld-plan="${escapeHtml(b.plan_id ?? '')}" data-bld-plan-key="${escapeHtml(b.plan_key ?? '')}" data-bld-name="${escapeHtml(bldName)}" data-bx="${b.x ?? 0}" data-by="${b.y ?? 64}" data-bz="${b.z ?? 0}" role="button" tabindex="0" title="${escapeHtml(focusBldTitle)}">
                                    <span class="bld-name">🏛️ ${escapeHtml(bldName)}</span>
                                    <span class="bld-meta tabular-num">${escapeHtml(lvlLabel)} • [${b.x ?? 0}, ${b.y ?? 0}, ${b.z ?? 0}]</span>
                                </li>
                            `;
                        }).join("")}
                    </ul>
                `;

            const economy = this.container ? this.container.querySelector("#tab-economy") : (document.getElementById ? document.getElementById("tab-economy") : null);
            if (!economy) return;
            economy.innerHTML = `
                ${this.buildSection("sec-treasury", "💰", this.i18n.t("panel.millenaire.economy.deniers", "Trésorerie & Réserves Majeures"), null, treasuryHtml, true)}
                ${this.buildSection("sec-projects", "🏗️", this.i18n.t("panel.millenaire.section.projects", "Chantiers de Construction"), projects.length, projectsHtml, true)}
                ${this.buildSection("sec-stockpiles", "📦", this.i18n.t("panel.millenaire.section.stockpiles", "Détail des Stocks en Coffres"), totalStockKinds, stockpilesHtml, totalStockKinds <= 15)}
                ${this.buildSection("sec-buildings", "🏛️", this.i18n.t("panel.millenaire.section.buildings", "Bâtiments Établis"), rawBuildings.length, buildingsHtml, rawBuildings.length <= 12)}
            `;

            // Bind click & keydown on buildings
            economy.querySelectorAll(".bld-clickable").forEach(el => {
                const triggerFocus = () => {
                    const bx = Number(el.dataset.bx) || 0;
                    const by = Number(el.dataset.by) || 64;
                    const bz = Number(el.dataset.bz) || 0;
                    this.focusCamera(bx, by, bz);
                };
                el.addEventListener("click", triggerFocus);
                el.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        triggerFocus();
                    }
                });
            });

            // 3. DIPLOMACY TAB
            const relations = v.relations ?? [];
            const diplo = this.container ? this.container.querySelector("#tab-diplomacy") : (document.getElementById ? document.getElementById("tab-diplomacy") : null);
            if (!diplo) return;

            let militaryAlertHtml = "";
            if (raidTarget) {
                const prefix = this.i18n.t("panel.millenaire.diplomacy.raid_banner_prefix", "Expédition militaire en cours :");
                const body = this.i18n.t("panel.millenaire.diplomacy.raid_banner_body", "Ce village mène un raid offensif vers {target} !", { target: `<u>${escapeHtml(raidTarget)}</u>` });
                militaryAlertHtml = `
                    <div class="military-raid-banner" role="alert">
                        ⚔️ <b>${escapeHtml(prefix)}</b> ${body}
                    </div>
                `;
            }

            const defaultTargetName = this.i18n.t("millenaire.bridge.ui.unknown_village", "Village Inconnu");
            const neutralStatus = this.i18n.t("relation.millenaire.neutral", "Neutre");
            const viewBtnLabel = this.i18n.t("panel.millenaire.diplomacy.view_btn", "Voir");
            const viewBtnTitle = this.i18n.t("panel.millenaire.diplomacy.view_btn_title", "Centrer la carte 3D sur ce village");

            const relationsListHtml = relations.length === 0
                ? `<p class="muted-note">${escapeHtml(this.i18n.t("panel.millenaire.diplomacy.no_relations", "Aucune relation diplomatique externe enregistrée pour cet établissement."))}</p>`
                : `
                    <ul class="diplo-list">
                        ${relations.map(rel => {
                            const score = rel.score ?? 0;
                            const colorHex = sanitizeHexColor(rel.color_hex, "#bdc3c7");
                            const icon = getRelationIcon(score);
                            const barWidth = Math.min(100, Math.abs(score));
                            const scorePrefix = score > 0 ? `+${score}` : `${score}`;
                            const tName = rel.target_name ?? defaultTargetName;
                            const tCult = this.i18n.t(rel.target_culture_key, rel.target_culture_name || "");
                            const statusLabel = this.i18n.t(rel.status_key, rel.status || neutralStatus);
                            const distLabel = rel.distance ? this.i18n.t("panel.millenaire.diplomacy.distance", "• Distance : {dist} m", { dist: Math.round(rel.distance) }) : "";
                            const viewBtnAria = this.i18n.t("panel.millenaire.diplomacy.view_btn_aria", "Centrer sur {target}", { target: tName });

                            return `
                                <li class="diplo-item" style="border-left: 4px solid ${colorHex}" data-target-id="${escapeHtml(rel.target_village_id ?? "")}" role="button" tabindex="0">
                                    <div class="diplo-main">
                                        <div class="diplo-info">
                                            <span class="diplo-target-name">${icon} <b>${escapeHtml(tName)}</b></span>
                                            <span class="diplo-status tabular-num" style="color: ${colorHex}">${escapeHtml(statusLabel)} (${scorePrefix})</span>
                                        </div>
                                        <div class="diplo-sub">
                                            <span>${escapeHtml(tCult)}</span>
                                            ${distLabel ? `<span class="tabular-num">${escapeHtml(distLabel)}</span>` : ""}
                                        </div>
                                        <div class="diplo-bar-track">
                                            <div class="diplo-bar-fill" style="width: ${barWidth}%; background: ${colorHex}"></div>
                                        </div>
                                    </div>
                                    <div class="diplo-actions">
                                        <button class="diplo-nav-btn" type="button" data-nav-id="${escapeHtml(rel.target_village_id ?? "")}" title="${escapeHtml(viewBtnTitle)}" aria-label="${escapeHtml(viewBtnAria)}">📍 ${escapeHtml(viewBtnLabel)}</button>
                                    </div>
                                </li>
                            `;
                        }).join("")}
                    </ul>
                `;

            diplo.innerHTML = `
                ${militaryAlertHtml}
                ${this.buildSection("sec-relations", "🤝", this.i18n.t("panel.millenaire.section.diplomacy", "Relations Inter-Villages"), relations.length, relationsListHtml, true)}
            `;

            // Bind click & keydown on diplomatic items
            diplo.querySelectorAll(".diplo-nav-btn, .diplo-item").forEach(el => {
                const navToTarget = (e) => {
                    e.stopPropagation();
                    const targetId = el.dataset.navId || el.dataset.targetId;
                    if (!targetId) return;
                    const targetVillage = (this.detailsData?.villages ?? []).find(item => item.id === targetId);
                    if (targetVillage) {
                        this.focusCamera(
                            targetVillage.center?.x ?? 0,
                            targetVillage.center?.y ?? 64,
                            targetVillage.center?.z ?? 0
                        );
                        this.openVillage(targetId);
                    }
                };
                el.addEventListener("click", navToTarget);
                el.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navToTarget(e);
                    }
                });
            });

            // Restore scroll position after render
            if (activeTabContent && prevScrollTop > 0) {
                activeTabContent.scrollTop = prevScrollTop;
            }
        }
    }

    // Initialize Millenaire i18n and UI Controller
    window.millenaireI18n = new MillenaireI18n();

    function startController() {
        window.millenaireI18n.init().then(() => {
            window.MillenairePanel = new MillenairePanelController(window.millenaireI18n);
        }).catch((err) => {
            console.error("Millenaire i18n initialization failed, fallback to defaults:", err);
            window.MillenairePanel = new MillenairePanelController(window.millenaireI18n);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startController);
    } else {
        startController();
    }
})();
