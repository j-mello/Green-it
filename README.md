# Green-it
Projet Green IT

## Membres du groupe
- Julien Bouvet julientbouvet78@hotmail.com
- Jacques Cai jacques.cai1999@hotmail.com
- Thomas Chatel thomas.chatel.acversailles@gmail.com
- Julien Mello mello.julien@gmail.com


## Mise en place de la base donnée

Pour génerer la base donnée des indicateurs de fragilité numérique nous avons opté pour MongoDB, avec l'ORM Mongoose en node js.

Nous avons créé le script generateDatabase.js, qui a partir des différents csv que nous avons récupéré,
et du fichier de configuration indicesConfig.js définissant qu'elles données récupérer précisément dans chaque csv,
génère une base de données Mongo.

Cette base de données Mongo est composé de trois principaux modèles : Les villes, les départements et les régions

Chaque ville, département et région dispose d'une liste d'axes correspondants aux 4 axes de fragilité numérique qui sont définis dans indicesConfig.js.
Chaque axe contient à son tour une liste d'indices eux aussi définis dans indicesConfig.js.

Pour chaque indice de chaque axe, dans chaque ville, les bons fichiers csv ainsi que les bonnes colones à récupérer sont indiquées dans indicesConfig.js

Pour chaque indice de chaque ville, nous faisons une moyenne de tout les iris de cette ville.

Pour chaque indice de chaque département, nous faisons une moyenne de toutes les villes de ce département.

Et pour chaque indice de chaque region, nous faisons une moyenne de tous les départements de cette région.

## Récupérer la base de données

Pour récupérer la base de données, vous pouvez :
 - Soit la regénerer en executant le script generateDatabase.js, qui est relativement long.
 - Soit extraire le dossier db du fichier db_final.zip, pour le mettre dans mongodb/data/
 
## Calcul du score

Pour le calcul du score, nous avons créé une route /score/:numéroOuNomDeLaVille.

Dans cette route, nous essayons d'abord de récupérer la ville avec l'identifiant qui a été donné.
Nous récupérons ensuite le département et la région qui correspondent à cette ville.

Une fois les données récupérées, nous calculons les scores de chaque indice de chaque axe, avec le calcul suivant : ((score-score_region)/score_region + 1) * 100.

Nous effectuons ce calcul pour la ville et le département.

Pour la région, nous nous contentons d'afficher les valeur des indicateurs directement

Ces données sont ensuite retournées au front pour être affichées