/**
 * BlueMap Millénaire Interactive Side Panel & Village Directory Extension
 * Compatible with BlueMap 5.29 & Millénaire 9.1.0 (MC 26.3 / NeoForge)
 * UI/UX Craftsman: Collapsible Sections, Contextual Tooltips, Tabular Metrics & a11y
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

    // Official descriptions from Millénaire's Travel Book and game files
    const VILLAGE_TYPE_LORE = {
        "norman/agricole": {
            title: "Village Agricole Normand",
            icon: "🌾",
            desc: "Un village où de la nourriture abondante est produite sous l'œil vigilant du Sénéchal pour être stockée dans son luxueux manoir.",
            specialty: "Production vivrière • Élevage • Manoir du Sénéchal"
        },
        "norman/artisans": {
            title: "Village d'Artisans Normand",
            icon: "⚒️",
            desc: "Centré sur un majestueux hôtel de ville, ce village est spécialisé dans les bâtiments luxueux et l'authentique artisanat de forge et de maçonnerie.",
            specialty: "Extraction de pierre • Outils avancés • Grande Mairie"
        },
        "norman/ecclesiastique": {
            title: "Village Ecclésiastique Normand",
            icon: "⛪",
            desc: "Étendu autour d'une grande abbaye, ce village existe pour servir les besoins matériels du moine et de la communauté en échange du Salut.",
            specialty: "Abbaye • Livres & Parchemins • Prieuré"
        },
        "norman/militaire": {
            title: "Village Militaire Normand",
            icon: "🛡️",
            desc: "Un village fortifié entourant un donjon militaire massif, approvisionnant la garnison en armes blanches, armures et rations de combat.",
            specialty: "Garnison d'élite • Fortifications • Armurerie"
        },
        "norman/grosbourg": {
            title: "Gros Bourg Normand",
            icon: "🏰",
            desc: "Le centre d'un prospère réseau de hameaux. Ce grand village détient les ateliers et bâtiments communautaires les plus avancés de la région.",
            specialty: "Capitale régionale • Réseau de hameaux • Marché central"
        },
        "norman/notredame": {
            title: "Cité de la Merveille (Normande)",
            icon: "🏛️",
            desc: "Centré sur le chantier de la prestigieuse Cathédrale Normande, ce village supporte la construction de la Merveille et accueille les pèlerins.",
            specialty: "Merveille du Monde • Dons sacrés • Accueil de pèlerins"
        },
        "norman/lonelumberman": {
            title: "Bûcheron Solitaire",
            icon: "🪓",
            desc: "Établissement forestier isolé. Un artisan bûcheron y exploite les forêts environnantes pour fournir du bois de construction aux voyageurs.",
            specialty: "Bâtiment isolé • Exploitation sylvicole • Commerce de bois"
        },
        "norman/loneinn": {
            title: "Auberge Étape",
            icon: "🍺",
            desc: "Relais d'étape implanté au croisement des routes sauvages. Offre le gîte, des boissons fraîches et des provisions aux aventuriers.",
            specialty: "Bâtiment isolé • Restauration • Commerce voyageur"
        },
        "norman/banditlair": {
            title: "Repaire de Bandits",
            icon: "☠️",
            desc: "Campement de hors-la-loi hostiles. Ces maraudeurs attaquent les voyageurs et ne dépendent d'aucune autorité villageoise.",
            specialty: "Camp hostile • Butins pillés • Danger armé"
        },
        "norman/abandonedmine": {
            title: "Mine Abandonnée",
            icon: "⛏️",
            desc: "Ancienne exploitation souterraine désaffectée. Bien que déserte, elle abrite encore de riches filons de pierre et de minerais.",
            specialty: "Site archéologique • Filons de roche • Vestige"
        },
        "byzantines/religiousvillage": {
            title: "Village Religieux Byzantin (Monastiriako Chorio)",
            icon: "👑",
            desc: "Dirigé par un Métropolitain, ce village impérial est réputé pour ses églises d'inspiration romaine, ses fresques, sa soie et son huile d'olive.",
            specialty: "Églises byzantines • Icônes & Soie • Huile d'olive"
        },
        "byzantines/militaryvillage": {
            title: "Village Militaire Byzantin",
            icon: "⚔️",
            desc: "Dirigé par un Centurion dans une forteresse massive, ce village produit de fines armures impériales, des armes d'acier et du vin d'exception.",
            specialty: "Légion impériale • Forteresse • Armes & Vins"
        },
        "byzantines/tradingvillage": {
            title: "Village Marchand Byzantin",
            icon: "🪙",
            desc: "Dirigé par un Baron autour d'un grand marché, réputé pour ses étoffes de soie brodée, ses tapis et son vin Malvasia raffiné.",
            specialty: "Carrefour commercial • Soieries • Vin Malvasia"
        },
        "japanese/bandit_cave": {
            title: "Caverne de Bandits (Iwamuro no Hito)",
            icon: "🗡️",
            desc: "Grotte fortifiée servant de refuge à un groupe de rōnin et de brigands japonais coupés de la société impériale.",
            specialty: "Hors-la-loi • Guerriers sans maître • Campement secret"
        },
        "japanese/kufun_tomb": {
            title: "Tombeau Mégalithique Kofun",
            icon: "⛩️",
            desc: "Ancien tertre funéraire sacré érigé en l'honneur d'un souverain ou d'un seigneur de guerre de l'époque féodale japonaise.",
            specialty: "Monument historique • Sépulture rituelle • Reliques"
        },
        "inuits/banditshack": {
            title: "Cabane de Pillards Inuits (Unatannik)",
            icon: "❄️",
            desc: "Abri de chasseurs renégats opérant dans la toundra glacée, tendant des embuscades aux expéditions solitaires.",
            specialty: "Pillards polaires • Peaux & Os • Campement nomade"
        },
        "inuits/huntingvillage": {
            title: "Village de Chasse Inuit",
            icon: "🦭",
            desc: "Communauté polaire axée sur la chasse aux phoques, la pêche sur glace et le travail des fourrures et du cuir marin.",
            specialty: "Chasse polaire • Fourrures épaisses • Harpons"
        },
        "mayan/agriculture": {
            title: "Village Agricole Maya",
            icon: "☀️",
            desc: "Établi autour d'un terrain de jeu de balle rituel, axé sur la culture sacrée du maïs et du cacao pour honorer le Roi.",
            specialty: "Fèves de cacao • Maïs sacré • Terrain rituel"
        },
        "mayan/military": {
            title: "Cité Militaire Maya",
            icon: "🏹",
            desc: "Protégé par une haute pyramide en gradins, ce village forme des guerriers d'élite et taille des armes tranchantes en obsidienne pure.",
            specialty: "Pyramide de guerre • Lames d'obsidienne • Sacrifices"
        },
        "indian/agricole": {
            title: "Village Agricole Indien",
            icon: "🪷",
            desc: "Village prospère centré sur la riziculture inondée, la cueillette d'épices rares et la préparation de curry parfumé.",
            specialty: "Rizières en terrasses • Épices sacrées • Briqueterie"
        },
        "indian/fort": {
            title: "Forteresse Rajput Indienne",
            icon: "🕌",
            desc: "Bâti au pied d'un grand fort en grès ciselé, ce village assure la défense des marches du royaume et la formation de lanciers.",
            specialty: "Grand Fort Rajput • Grès ouvragé • Gardes d'élite"
        }
    };

    // Functional descriptions for established buildings
    const BUILDING_DESCRIPTIONS = [
        { test: (id, name) => id.includes("townhall") || name.includes("mairie") || name.includes("hôtel de ville") || name.includes("centre"),
          title: "Bâtiment Central / Mairie", icon: "🏛️", desc: "Cœur politique et logistique du village. Centralise les coffres de deniers, planifie l'urbanisme et accueille les marchands.", role: "Administration & Trésorerie" },
        { test: (id, name) => id.includes("church") || id.includes("eglise") || id.includes("chapel") || id.includes("abbey") || name.includes("église") || name.includes("abbaye"),
          title: "Lieu de Culte / Église", icon: "⛪", desc: "Sanctuaire spirituel où le prêtre ou le moine célèbre les offices, garantit la bénédiction du village et conserve les reliques.", role: "Culte & Sérénité" },
        { test: (id, name) => id.includes("fort") || id.includes("castle") || id.includes("donjon") || name.includes("fort") || name.includes("château"),
          title: "Fortification / Donjon", icon: "🛡️", desc: "Ouvrage militaire majeur abritant le chef d'armes, la garnison et les réserves de guerre en cas d'attaque ennemie.", role: "Défense & Commandement" },
        { test: (id, name) => id.includes("borderpost") || id.includes("wall") || id.includes("gate") || name.includes("frontière") || name.includes("muraille") || name.includes("porte"),
          title: "Poste Frontière & Remparts", icon: "🧱", desc: "Délimite l'emprise territoriale du village. Fournit des postes de guet surélevés pour repérer les intrus et les monstres.", role: "Sécurité & Délimitation" },
        { test: (id, name) => id.includes("farm") || id.includes("champ") || name.includes("ferme") || name.includes("verger") || name.includes("grange"),
          title: "Ferme & Exploitation Vivrière", icon: "🌾", desc: "Produit les céréales, légumes et denrées de subsistance pour nourrir les villageois et stimuler la natalité.", role: "Production Vivrière" },
        { test: (id, name) => id.includes("bakery") || id.includes("boulang") || id.includes("mill") || name.includes("four") || name.includes("moulin"),
          title: "Fournil / Moulin Artisanal", icon: "🍞", desc: "Transforme les céréales brutes en farine puis en pains savoureux pour alimenter la réserve centrale de nourriture.", role: "Transformation des Vivres" },
        { test: (id, name) => id.includes("forge") || id.includes("smith") || name.includes("forge") || name.includes("armurerie"),
          title: "Forge & Métallurgie", icon: "⚒️", desc: "Atelier où le forgeron façonne des outils agraires robustes et des armes en fer pour équiper les sentinelles.", role: "Outillage & Équipement" },
        { test: (id, name) => id.includes("lumber") || id.includes("wood") || name.includes("bûcheron") || name.includes("scie"),
          title: "Poste de Bûcheron", icon: "🪓", desc: "Cabane de forestier abattant et taillant les arbres environnants pour fournir le bois indispensable aux chantiers.", role: "Ressources Sylvicoles" },
        { test: (id, name) => id.includes("quarry") || id.includes("mine") || name.includes("carrière") || name.includes("mine"),
          title: "Carrière d'Extraction", icon: "⛏️", desc: "Gisement de pierre, sable ou argile extrait activement pour approvisionner les maçons et briquetiers du village.", role: "Matériaux de Construction" },
        { test: (id, name) => id.includes("inn") || id.includes("tavern") || name.includes("auberge") || name.includes("taverne"),
          title: "Auberge / Taverne", icon: "🍺", desc: "Lieu de convivialité villageois servant du cidre ou du vin, favorisant les échanges et la venue de voyageurs marchands.", role: "Commerce & Convivialité" },
        { test: (id, name) => id.includes("house") || id.includes("maison") || id.includes("hab") || name.includes("maison"),
          title: "Maison d'Habitation", icon: "🏠", desc: "Demeure résidentielle hébergeant une famille de villageois et leurs enfants, contribuant à la croissance démographique.", role: "Logement & Population" }
    ];

    function resolveVillageLore(culture, villageType, isLone, typeName) {
        // Strip culture prefix if duplicate
        const cult = (culture || "").replace("millenaire:", "");
        const rawType = (villageType || "").replace("millenaire:", "");
        const cleanType = rawType.includes("/") ? rawType.split("/")[1] : rawType;
        const lookupKey = `${cult}/${cleanType}`;

        if (VILLAGE_TYPE_LORE[lookupKey]) return VILLAGE_TYPE_LORE[lookupKey];
        if (VILLAGE_TYPE_LORE[cleanType]) return VILLAGE_TYPE_LORE[cleanType];

        // Search partial matches
        for (const [k, v] of Object.entries(VILLAGE_TYPE_LORE)) {
            if (cleanType.includes(k.split("/")[1]) || (cult && k.startsWith(cult))) {
                if (cleanType.toLowerCase().includes(k.toLowerCase())) return v;
            }
        }

        // Generic Fallback
        if (isLone) {
            return {
                title: typeName || "Bâtiment Isolé",
                icon: "🏕️",
                desc: "Un avant-poste indépendant ou une demeure autonome vivant en autarcie dans la nature sans gouvernance de village.",
                specialty: "Autarcie • Commerce autonome • Présence locale"
            };
        }
        return {
            title: typeName || "Communauté Villageoise",
            icon: "🏘️",
            desc: "Un village Millénaire autonome doté de son propre modèle économique, de ses artisans et de ses lois coutumières.",
            specialty: "Économie locale • Urbanisme dynamique • Diplomatie"
        };
    }

    function resolveBuildingLore(planId, name) {
        const p = (planId || "").toLowerCase();
        const n = (name || "").toLowerCase();
        for (const b of BUILDING_DESCRIPTIONS) {
            if (b.test(p, n)) return b;
        }
        return {
            title: name || "Bâtiment Communautaire",
            icon: "🏛️",
            desc: "Structure villageoise établie contribuant à l'essor, à l'organisation ou au patrimoine de la communauté locale.",
            role: "Infrastructure du village"
        };
    }

    // Fallback dictionary for common vanilla item keys in projects
    const VANILLA_TRANSLATIONS = {
        "minecraft:cauldron": "Chaudron",
        "minecraft:furnace": "Fourneau",
        "minecraft:crafting_table": "Établi",
        "minecraft:chest": "Coffre",
        "minecraft:ladder": "Échelle",
        "minecraft:glass": "Verre",
        "minecraft:torch": "Torche",
        "minecraft:iron_bars": "Barreaux de fer",
        "minecraft:smooth_stone": "Roche lisse",
        "minecraft:cobblestone": "Pierre",
        "minecraft:stone": "Roche",
        "minecraft:oak_log": "Bûche de chêne",
        "minecraft:birch_log": "Bûche de bouleau",
        "minecraft:spruce_log": "Bûche de sapin",
        "minecraft:dark_oak_log": "Bûche de chêne noir",
        "minecraft:acacia_log": "Bûche d'acacia",
        "minecraft:jungle_log": "Bûche d'acajou",
        "minecraft:mangrove_log": "Bûche de palétuvier",
        "minecraft:cherry_log": "Bûche de cerisier",
        "millenaire:anywood_log": "Bûches (tout type)",
        "millenaire:thatch": "Chaume",
        "millenaire:mudbrick": "Brique de boue",
        "millenaire:cookedbrick": "Brique cuite",
        "millenaire:byzantine_stone_tile": "Tuile de pierre byzantine",
        "millenaire:paper_wall": "Mur en papier"
    };

    function translateItem(itemId, fallbackName) {
        if (!itemId) return fallbackName || "Matériau inconnu";
        if (VANILLA_TRANSLATIONS[itemId]) return VANILLA_TRANSLATIONS[itemId];
        if (fallbackName && fallbackName !== itemId && !fallbackName.startsWith("minecraft:")) {
            return fallbackName;
        }
        const raw = itemId.replace(/^[a-z0-9_-]+:/, "").replace(/_/g, " ");
        return raw.charAt(0).toUpperCase() + raw.slice(1);
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

    class MillenairePanelController {
        constructor() {
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
            this.launcherBtn.title = "Afficher l'annuaire des villages Millénaire";
            this.launcherBtn.setAttribute("type", "button");
            this.launcherBtn.setAttribute("aria-label", "Annuaire des villages Millénaire");
            this.launcherBtn.innerHTML = `
                <span class="launcher-icon" aria-hidden="true">🏰</span>
                <span class="launcher-label">Villages</span>
                <span id="millenaire-village-count" class="launcher-count">…</span>
            `;
            
            this.mountIntoControlBar();

            // 2. Directory Drawer
            this.directoryModal = document.createElement("div");
            this.directoryModal.id = "millenaire-directory-panel";
            this.directoryModal.className = "millenaire-directory hidden";
            this.directoryModal.setAttribute("role", "dialog");
            this.directoryModal.setAttribute("aria-label", "Annuaire des villages Millénaire");
            this.directoryModal.innerHTML = `
                <div class="dir-header">
                    <div class="dir-title-row">
                        <span class="dir-title">🏰 Annuaire des Villages Millénaire</span>
                        <button id="dir-close-btn" class="close-btn" type="button" title="Fermer" aria-label="Fermer l'annuaire">✕</button>
                    </div>
                    <div class="dir-controls">
                        <input type="text" id="dir-search-input" class="dir-search" placeholder="Rechercher un village ou une culture..." aria-label="Recherche" />
                        <div class="dir-filters" role="group" aria-label="Filtrer par type">
                            <button class="filter-chip active" type="button" data-filter="all">Tous</button>
                            <button class="filter-chip" type="button" data-filter="villages">Villages</button>
                            <button class="filter-chip" type="button" data-filter="lone">Isolés</button>
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
            this.container.setAttribute("aria-label", "Détails du village Millénaire");
            this.container.innerHTML = `
                <div class="panel-header">
                    <div class="title-row">
                        <span id="panel-crest" class="culture-crest" aria-hidden="true">🏛️</span>
                        <h2 id="panel-village-name">Nom du Village</h2>
                        <button id="panel-list-btn" class="icon-btn" type="button" title="Retour à l'annuaire" aria-label="Retour à la liste des villages">📋</button>
                        <button id="panel-close-btn" class="close-btn" type="button" title="Fermer le panneau" aria-label="Fermer le panneau">✕</button>
                    </div>
                    <div class="sub-row">
                        <span id="panel-culture" class="badge">Normand</span>
                        <button type="button" id="panel-type" class="type-pill has-tooltip" title="Cliquer ou survoler pour la description">Village <span class="tip-icon">ℹ️</span></button>
                        <span id="panel-coords" class="coords" title="Coordonnées du centre">X: 0, Y: 0, Z: 0</span>
                        <button id="panel-focus-btn" class="focus-btn" type="button" title="Centrer la vue 3D">📍 Centrer</button>
                    </div>
                    <div id="panel-QuickStats" class="quick-stats-bar"></div>
                </div>
                <div class="panel-tabs" role="tablist">
                    <button class="tab-btn active" role="tab" aria-selected="true" data-tab="census">👥 Population</button>
                    <button class="tab-btn" role="tab" aria-selected="false" data-tab="economy">📦 Économie & Travaux</button>
                    <button class="tab-btn" role="tab" aria-selected="false" data-tab="diplomacy">🤝 Diplomatie</button>
                </div>
                <div class="panel-body">
                    <div id="tab-census" class="tab-content active" role="tabpanel"></div>
                    <div id="tab-economy" class="tab-content" role="tabpanel"></div>
                    <div id="tab-diplomacy" class="tab-content" role="tabpanel"></div>
                </div>
                <div class="panel-footer">
                    <span id="panel-timestamp">Synchronisation en temps réel</span>
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
                    <span class="mil-tooltip-title">Titre</span>
                </div>
                <div class="mil-tooltip-body">Description</div>
                <div class="mil-tooltip-footer">
                    <span class="mil-tooltip-tag">Spécialité</span>
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
            let top = rect.bottom + 8; // Default below

            // Boundary checks
            if (left < 10) left = 10;
            if (left + tipWidth > window.innerWidth - 10) {
                left = window.innerWidth - tipWidth - 10;
            }
            if (top + tipHeight > window.innerHeight - 10) {
                // Flip to above
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

        mountIntoControlBar() {
            const controlBar = document.querySelector(".control-bar");
            if (controlBar) {
                const greedySpace = controlBar.querySelector(".space.greedy");
                if (greedySpace) {
                    if (this.launcherBtn.parentElement !== controlBar) {
                        controlBar.insertBefore(this.launcherBtn, greedySpace);
                        this.launcherBtn.classList.add("in-control-bar");
                    }
                }
            }
            setTimeout(() => this.mountIntoControlBar(), 500);
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
            this.fetchDetails(true);
        }

        closeDirectory() {
            this.directoryModal.classList.add("hidden");
        }

        bindEvents() {
            // Direct click on button
            this.launcherBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.toggleDirectory();
            });

            // Delegated global click for launcher button (immune to DOM replacements)
            document.addEventListener("click", (evt) => {
                const btn = evt.target.closest("#millenaire-launcher-btn, .millenaire-launcher-btn");
                if (btn) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    this.toggleDirectory();
                    return;
                }

                // Close tooltip when clicking elsewhere
                if (!evt.target.closest(".has-tooltip, #millenaire-tooltip")) {
                    this.hideTooltip();
                }
            });

            this.directoryModal.querySelector("#dir-close-btn").addEventListener("click", () => this.closeDirectory());

            this.directoryModal.querySelector("#dir-search-input").addEventListener("input", (e) => {
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

            this.container.querySelector("#panel-close-btn").addEventListener("click", () => this.close());
            this.container.querySelector("#panel-list-btn").addEventListener("click", () => {
                this.openDirectory();
            });

            this.container.querySelectorAll(".tab-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    this.switchTab(btn.dataset.tab);
                });
            });

            this.container.querySelector("#panel-focus-btn").addEventListener("click", () => {
                if (this.currentVillage) {
                    const c = this.currentVillage.center;
                    this.focusCamera(c?.x ?? 0, c?.y ?? 64, c?.z ?? 0);
                }
            });

            // Village Type Header Tooltip Trigger
            const panelTypeBtn = this.container.querySelector("#panel-type");
            const showVillageTypeTip = () => {
                if (!this.currentVillage) return;
                const lore = resolveVillageLore(
                    this.currentVillage.culture,
                    this.currentVillage.village_type,
                    this.currentVillage.is_lone_building,
                    this.currentVillage.village_type_name
                );
                this.showTooltip(panelTypeBtn, lore.title, lore.desc, lore.specialty, lore.icon);
            };

            panelTypeBtn.addEventListener("mouseenter", showVillageTypeTip);
            panelTypeBtn.addEventListener("mouseleave", () => this.hideTooltip());
            panelTypeBtn.addEventListener("focus", showVillageTypeTip);
            panelTypeBtn.addEventListener("blur", () => this.hideTooltip());
            panelTypeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this.tooltipEl.classList.contains("visible")) {
                    this.hideTooltip();
                } else {
                    showVillageTypeTip();
                }
            });

            // Delegate tooltips on buildings
            document.addEventListener("mouseover", (evt) => {
                const bldEl = evt.target.closest(".bld-clickable.has-tooltip");
                if (bldEl) {
                    const planId = bldEl.dataset.bldPlan || "";
                    const name = bldEl.dataset.bldName || "";
                    const lore = resolveBuildingLore(planId, name);
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

        installObjectMarkerInterceptor() {
            if (!window.BlueMap || !window.BlueMap.ObjectMarker) {
                setTimeout(() => this.installObjectMarkerInterceptor(), 200);
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
                return originalOnClick.call(this, event);
            };
        }

        startAutoRefresh() {
            if (this.pollTimer) clearInterval(this.pollTimer);
            this.pollTimer = setInterval(() => {
                const isPanelOpen = !this.container.classList.contains("hidden");
                const isDirOpen = !this.directoryModal.classList.contains("hidden");
                if (isPanelOpen || isDirOpen) {
                    this.fetchDetails(true);
                }
            }, 5000);
        }

        async fetchDetails(silent = false) {
            try {
                const res = await fetch("data/millenaire_details.json?t=" + Date.now());
                if (!res.ok) return null;
                this.detailsData = await res.json();
                const villages = this.detailsData?.villages ?? [];
                const countEl = document.getElementById("millenaire-village-count");
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
                if (!silent) {
                    console.error("Failed to load Millénaire details:", err);
                }
                return null;
            }
        }

        renderDirectory() {
            const listEl = document.getElementById("dir-village-list");
            if (!listEl) return;
            const villages = (this.detailsData?.villages ?? []).slice();

            const filtered = villages.filter(v => {
                const isLone = Boolean(v.is_lone_building);
                if (this.filterMode === "villages" && isLone) return false;
                if (this.filterMode === "lone" && !isLone) return false;
                if (this.searchQuery) {
                    const nameMatch = (v.name ?? "").toLowerCase().includes(this.searchQuery);
                    const cultMatch = (v.culture_name ?? v.culture ?? "").toLowerCase().includes(this.searchQuery);
                    const typeMatch = (v.village_type_name ?? v.village_type ?? "").toLowerCase().includes(this.searchQuery);
                    return nameMatch || cultMatch || typeMatch;
                }
                return true;
            });

            filtered.sort((a, b) => {
                const loneA = a.is_lone_building ? 1 : 0;
                const loneB = b.is_lone_building ? 1 : 0;
                if (loneA !== loneB) return loneA - loneB;
                const popDiff = (b.population?.total ?? 0) - (a.population?.total ?? 0);
                if (popDiff !== 0) return popDiff;
                return (a.name ?? "").localeCompare(b.name ?? "");
            });

            if (filtered.length === 0) {
                listEl.innerHTML = `<div class="empty-state">Aucun village correspondant trouvé.</div>`;
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

                return `
                    <div class="dir-item ${isSelected ? "selected" : ""}" data-village-id="${escapeHtml(v.id)}" role="button" tabindex="0">
                        <div class="dir-item-crest" style="background: ${color}22; border-color: ${color}">${icon}</div>
                        <div class="dir-item-main">
                            <div class="dir-item-top">
                                <span class="dir-item-name">${escapeHtml(v.name ?? "Village")}</span>
                                <span class="dir-item-culture" style="background: ${color}">${escapeHtml(v.culture_name ?? v.culture)}</span>
                            </div>
                            <div class="dir-item-meta">
                                <span>👤 ${pop} hab.</span>
                                <span>🏛️ ${bldCount} bât.</span>
                                ${relCount > 0 ? `<span>🤝 ${relCount} rel.</span>` : ""}
                                <span class="dir-coords tabular-num">[${cx}, ${cy}, ${cz}]</span>
                            </div>
                        </div>
                        <button class="dir-goto-btn" type="button" data-goto-id="${escapeHtml(v.id)}" title="Centrer et inspecter" aria-label="Centrer sur ${escapeHtml(v.name ?? 'ce village')}">📍</button>
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
                            <span class="section-title">${title}</span>
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

            this.container.querySelector("#panel-village-name").textContent = v.name ?? "Village Inconnu";

            const cultBadge = this.container.querySelector("#panel-culture");
            cultBadge.textContent = v.culture_name ?? (v.culture ?? "Inconnu");
            cultBadge.style.background = cultureColor;

            const typeBadge = this.container.querySelector("#panel-type");
            const typeLabel = v.is_lone_building ? (v.village_type_name || "Bâtiment isolé") : (v.village_type_name ?? "Village");
            typeBadge.innerHTML = `${escapeHtml(typeLabel)} <span class="tip-icon" aria-hidden="true">ℹ️</span>`;

            const cx = v.center?.x ?? 0;
            const cy = v.center?.y ?? 0;
            const cz = v.center?.z ?? 0;
            this.container.querySelector("#panel-coords").textContent = `X: ${cx}, Y: ${cy}, Z: ${cz}`;

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
                    statusHtml = '<span class="qstat qstat-alert">🔥 Sous attaque !</span>';
                } else if (raidTarget) {
                    statusHtml = `<span class="qstat qstat-raid" title="Raid en cours contre ${escapeHtml(raidTarget)}">⚔️ En raid → ${escapeHtml(raidTarget)}</span>`;
                } else {
                    statusHtml = '<span class="qstat qstat-peace">🕊️ Paisible</span>';
                }

                quickBar.innerHTML = `
                    ${statusHtml}
                    <span class="qstat" title="Force défensive">🛡️ Déf: <b class="tabular-num">${defRating}</b></span>
                    <span class="qstat" title="Force de raid">⚔️ Raid: <b class="tabular-num">${raidStrength}</b></span>
                    <span class="qstat" title="Nombre de bâtiments">🏛️ Bât: <b class="tabular-num">${bldCount}</b></span>
                `;
            }

            // Timestamp footer
            const tsEl = this.container.querySelector("#panel-timestamp");
            if (tsEl && this.detailsData?.timestamp) {
                const dateStr = new Date(this.detailsData.timestamp).toLocaleTimeString("fr-FR");
                tsEl.textContent = `Mis à jour à ${dateStr} • Monde : ${escapeHtml(this.detailsData.world ?? "overworld")}`;
            }

            // 1. POPULATION TAB
            const pop = v.population ?? {};
            const roster = pop.roster ?? [];
            const census = document.getElementById("tab-census");

            const statGridHtml = `
                <div class="stat-grid">
                    <div class="stat-card"><span>Population Totale</span><b class="tabular-num">${pop.total ?? 0}</b></div>
                    <div class="stat-card"><span>Hommes</span><b class="tabular-num">${pop.men ?? 0}</b></div>
                    <div class="stat-card"><span>Femmes</span><b class="tabular-num">${pop.women ?? 0}</b></div>
                    <div class="stat-card"><span>Enfants</span><b class="tabular-num">${pop.children ?? 0}</b></div>
                </div>
            `;

            const rosterHtml = `
                <ul class="resident-list">
                    ${roster.length === 0 ? '<li class="empty-row"><span class="resident-name">Aucun habitant recensé.</span></li>' : roster.map(r => `
                        <li>
                            <div class="resident-info">
                                <span class="resident-name">${escapeHtml(r.name ?? "Inconnu")}</span>
                                <span class="resident-sub">${escapeHtml(r.role ?? "Villageois")}${r.home_building ? ` • 🏠 ${escapeHtml(r.home_building)}` : ""}</span>
                            </div>
                            <div class="resident-badges">
                                ${r.is_combatant ? `<span class="shield-badge tabular-num" title="Force militaire: ${r.military_strength ?? 0}">🛡️ ${r.military_strength ?? ""}</span>` : ""}
                                ${r.is_raiding ? '<span class="raid-badge">⚔️ Raid</span>' : ""}
                                ${r.is_hired ? '<span class="hired-badge">🤝 Embauché</span>' : ""}
                                ${r.is_killed ? '<span class="dead-badge">💀 Décédé</span>' : ""}
                            </div>
                        </li>
                    `).join("")}
                </ul>
            `;

            census.innerHTML = `
                ${statGridHtml}
                ${this.buildSection("sec-roster", "👥", "Registre des Habitants", roster.length, rosterHtml, true)}
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
            for (const b of rawBuildings) {
                const plan = (b.plan_id || "").toLowerCase();
                const name = (b.name || "").toLowerCase();
                const isWall = plan.includes("wall") || plan.includes("segment") || plan.includes("borne") || plan.includes("path") || name.includes("muraille") || name.includes("borne");
                if (isWall) {
                    const count = wallTypes.get(b.name || "Muraille") || { count: 0, bld: b };
                    count.count++;
                    wallTypes.set(b.name || "Muraille", count);
                } else {
                    groupedBuildings.push({ isGroup: false, bld: b });
                }
            }
            for (const [wallName, data] of wallTypes.entries()) {
                groupedBuildings.push({ isGroup: true, name: wallName, count: data.count, bld: data.bld });
            }

            const materialEntries = Object.entries(materialsMap);
            const foodEntries = Object.entries(foodMap);
            const totalStockKinds = materialEntries.length + foodEntries.length;

            const treasuryHtml = `
                <div class="coins-row">
                    <span class="coin-pill gold">🪙 <b class="tabular-num">${gold}</b> Or</span>
                    <span class="coin-pill silver">🥈 <b class="tabular-num">${silver}</b> Argent</span>
                    <span class="coin-pill copper">🥉 <b class="tabular-num">${copper}</b> Bronze</span>
                </div>
                <div class="stat-grid stat-grid-3">
                    <div class="stat-card"><span>🪵 Bois</span><b class="tabular-num">${wood}</b></div>
                    <div class="stat-card"><span>🪨 Pierre</span><b class="tabular-num">${stone}</b></div>
                    <div class="stat-card"><span>🍞 Nourriture</span><b class="tabular-num">${food}</b></div>
                </div>
            `;

            const projectsHtml = projects.length === 0
                ? '<p class="muted-note">Aucun chantier en cours actuellement.</p>'
                : `
                    <ul class="project-list">
                        ${projects.map(p => {
                            const pct = Math.round((p.progress ?? 0) * 100);
                            const reqs = p.required_resources ?? [];
                            const missingCount = reqs.filter(r => (r.available ?? 0) < (r.required ?? 0)).length;
                            return `
                                <li class="project-card ${p.is_blocked ? 'is-blocked' : ''}">
                                    <div class="proj-header">
                                        <span class="proj-name">🏗️ <b>${escapeHtml(p.name ?? "Chantier")}</b></span>
                                        <span class="proj-steps tabular-num">${pct}% (${p.current_step ?? 0}/${p.total_steps ?? 0})</span>
                                    </div>
                                    <div class="progress-bar"><div class="fill" style="width: ${pct}%"></div></div>
                                    ${p.is_blocked ? '<div class="blocked-alert">⚠️ Chantier suspendu : matériaux manquants en coffres</div>' : ''}
                                    ${reqs.length > 0 ? `
                                        <div class="resource-requirements-block">
                                            <div class="req-title-row">
                                                <span>Matériaux requis pour l'étape :</span>
                                                ${missingCount > 0
                                                    ? `<span class="req-missing-tag">⚠️ ${missingCount} manquant${missingCount > 1 ? 's' : ''}</span>`
                                                    : '<span class="req-ready-tag">✓ Approvisionné</span>'
                                                }
                                            </div>
                                            <div class="resource-need-grid">
                                                ${reqs.map(r => {
                                                    const reqVal = r.required ?? 0;
                                                    const availVal = r.available ?? 0;
                                                    const isReady = availVal >= reqVal;
                                                    const diff = reqVal - availVal;
                                                    const ratio = Math.min(100, Math.round((availVal / Math.max(1, reqVal)) * 100));
                                                    const itemName = translateItem(r.item_id, r.item_name);

                                                    return `
                                                        <div class="resource-gauge-card ${isReady ? 'is-ready' : 'is-missing'}" title="${isReady ? 'Ressource suffisante en stock' : `Déficit de ${diff} unités`}">
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
                ? '<p class="muted-note">Aucune marchandise recensée dans les coffres.</p>'
                : `
                    <div class="stock-chips">
                        ${materialEntries.map(([k, val]) => `<span class="stock-chip">🧱 ${escapeHtml(k)}: <b class="tabular-num">${val}</b></span>`).join("")}
                        ${foodEntries.map(([k, val]) => `<span class="stock-chip food">🍎 ${escapeHtml(k)}: <b class="tabular-num">${val}</b></span>`).join("")}
                    </div>
                `;

            const buildingsHtml = rawBuildings.length === 0
                ? '<p class="muted-note">Aucun bâtiment établi.</p>'
                : `
                    <ul class="building-list">
                        ${groupedBuildings.map(item => {
                            if (item.isGroup) {
                                return `
                                    <li class="bld-clickable has-tooltip" data-bld-plan="${escapeHtml(item.bld.plan_id ?? '')}" data-bld-name="${escapeHtml(item.name)}" data-bx="${item.bld.x ?? 0}" data-by="${item.bld.y ?? 64}" data-bz="${item.bld.z ?? 0}" role="button" tabindex="0" title="Cliquer pour centrer la zone">
                                        <span class="bld-name">🛡️ ${escapeHtml(item.name)} <span class="group-count tabular-num">×${item.count}</span></span>
                                        <span class="bld-meta tabular-num">Fortifications • [${item.bld.x ?? 0}, ${item.bld.y ?? 0}, ${item.bld.z ?? 0}]</span>
                                    </li>
                                `;
                            }
                            const b = item.bld;
                            return `
                                <li class="bld-clickable has-tooltip" data-bld-plan="${escapeHtml(b.plan_id ?? '')}" data-bld-name="${escapeHtml(b.name ?? b.plan_id ?? 'Bâtiment')}" data-bx="${b.x ?? 0}" data-by="${b.y ?? 64}" data-bz="${b.z ?? 0}" role="button" tabindex="0" title="Cliquer pour centrer la caméra 3D">
                                    <span class="bld-name">🏛️ ${escapeHtml(b.name ?? b.plan_id ?? "Bâtiment")}</span>
                                    <span class="bld-meta tabular-num">Niv. ${b.level ?? 0} • [${b.x ?? 0}, ${b.y ?? 0}, ${b.z ?? 0}]</span>
                                </li>
                            `;
                        }).join("")}
                    </ul>
                `;

            const economy = document.getElementById("tab-economy");
            economy.innerHTML = `
                ${this.buildSection("sec-treasury", "💰", "Trésorerie & Réserves Majeures", null, treasuryHtml, true)}
                ${this.buildSection("sec-projects", "🏗️", "Chantiers de Construction", projects.length, projectsHtml, true)}
                ${this.buildSection("sec-stockpiles", "📦", "Détail des Stocks en Coffres", totalStockKinds, stockpilesHtml, totalStockKinds <= 15)}
                ${this.buildSection("sec-buildings", "🏛️", "Bâtiments Établis", rawBuildings.length, buildingsHtml, rawBuildings.length <= 12)}
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
            const diplo = document.getElementById("tab-diplomacy");

            let militaryAlertHtml = "";
            if (raidTarget) {
                militaryAlertHtml = `
                    <div class="military-raid-banner" role="alert">
                        ⚔️ <b>Expédition militaire en cours :</b> Ce village mène un raid offensif vers <u>${escapeHtml(raidTarget)}</u> !
                    </div>
                `;
            }

            const relationsListHtml = relations.length === 0
                ? '<p class="muted-note">Aucune relation diplomatique externe enregistrée pour cet établissement.</p>'
                : `
                    <ul class="diplo-list">
                        ${relations.map(rel => {
                            const score = rel.score ?? 0;
                            const colorHex = sanitizeHexColor(rel.color_hex, "#bdc3c7");
                            const icon = getRelationIcon(score);
                            const barWidth = Math.min(100, Math.abs(score));
                            const scorePrefix = score > 0 ? `+${score}` : `${score}`;
                            return `
                                <li class="diplo-item" style="border-left: 4px solid ${colorHex}" data-target-id="${escapeHtml(rel.target_village_id ?? "")}" role="button" tabindex="0">
                                    <div class="diplo-main">
                                        <div class="diplo-info">
                                            <span class="diplo-target-name">${icon} <b>${escapeHtml(rel.target_name ?? "Village Inconnu")}</b></span>
                                            <span class="diplo-status tabular-num" style="color: ${colorHex}">${escapeHtml(rel.status ?? "Neutre")} (${scorePrefix})</span>
                                        </div>
                                        <div class="diplo-sub">
                                            <span>${escapeHtml(rel.target_culture_name ?? "")}</span>
                                            ${rel.distance ? `<span class="tabular-num">• Distance : ${Math.round(rel.distance)} m</span>` : ""}
                                        </div>
                                        <div class="diplo-bar-track">
                                            <div class="diplo-bar-fill" style="width: ${barWidth}%; background: ${colorHex}"></div>
                                        </div>
                                    </div>
                                    <div class="diplo-actions">
                                        <button class="diplo-nav-btn" type="button" data-nav-id="${escapeHtml(rel.target_village_id ?? "")}" title="Centrer la carte 3D sur ce village" aria-label="Centrer sur ${escapeHtml(rel.target_name ?? 'ce village')}">📍 Voir</button>
                                    </div>
                                </li>
                            `;
                        }).join("")}
                    </ul>
                `;

            diplo.innerHTML = `
                ${militaryAlertHtml}
                ${this.buildSection("sec-relations", "🤝", "Relations Inter-Villages", relations.length, relationsListHtml, true)}
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

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            window.MillenairePanel = new MillenairePanelController();
        });
    } else {
        window.MillenairePanel = new MillenairePanelController();
    }
})();
