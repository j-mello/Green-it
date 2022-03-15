module.exports = {
    colsNameByFolder: {
        default: {
            numCommune: 'Commune ou ARM',
            nameCommune: 'Libellé commune ou ARM',
        },
        "Revenus et pauvreté des ménages en 2016": {
            numCommune: 'Code géographique',
            nameCommune: 'Libellé géographique'
        }
    },
    axes: [
        {
            name: "Accès à l’information",
            indices: [
                {
                    name: "Part des ménages d’une personne",
                    docFolder: "Couples - Familles - Ménages en 2016",
                    cols: ["Ménages 1 personne en 2016 (compl)"]
                },
                {
                    name: "Part des ménages monoparentaux",
                    docFolder: "Couples - Familles - Ménages en 2016",
                    cols: ["Pop mén fam princ Famille mono en 2016 (compl)"]
                }
            ]
        },
        {
            name: "Compétences administratives",
            indices: [
                {
                    name: "Part des chômeurs (15 – 64 ans)",
                    docFolder: "Revenus, pauvreté et niveau de vie en 2015 (IRIS)",
                    cols: ["dont part des indemnités de chômage (%)"]
                },
                {
                    name: "Taux de pauvreté",
                    docFolder: "Revenus et pauvreté des ménages en 2016",
                    cols: ["Médiane du niveau vie (€)"]
                },
                {
                    name: "Part des bénéficiaires des minima sociaux",
                    docFolder: "Revenus et pauvreté des ménages en 2016",
                    cols: ["dont part des minima sociaux (%)"]
                },
                {
                    name: "Part des moins de 25 ans",
                    docFolder: "Population 2016",
                    cols: ["Pop 18-24 ans en 2016 (princ)"]
                }
            ]
        },
        {
            name: "Compétences numériques",
            indices: [
                {
                    name: "Part des personnes âgées de 65 ans et plus",
                    docFolder: "Population 2016",
                    cols: [
                        'Pop 65-79 ans en 2016 (princ)',
                        'Pop 80 ans ou plus en 2016 (princ)'
                    ]
                },
                {
                    name: "Part des personnes de 15 ans\n" +
                        "et plus peu / non diplômées et\n" +
                        "Non scolarisées",
                    docFolder: "Diplômes - Formation en 2016",
                    cols: [
                        "Pop 15 ans ou plus non scolarisée en 2016 (princ)",
                        "Pop 15 ans ou plus non scol. Sans diplôme ou BEPC, brevet des collèges, DNB en 2016 (princ)",
                        "Pop 15 ans ou plus non scol. CAP-BEP en 2016 (princ)",
                        "Pop 15 ans ou plus non scol. BAC en 2016 (princ)",
                        "Pop 15 ans ou plus non scol. Enseignement sup en 2016 (princ)"
                    ]
                }
            ]
        }
    ]
}