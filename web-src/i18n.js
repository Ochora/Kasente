/* ===== Build 3 · languages: English (source), Kiswahili, Français =====
   Translations are applied to what is on screen. Phrases not in the list stay in English.
   Before launch, a native speaker of each language should review this list. */
const T_DICT={
/* navigation and titles */
'Home':['Nyumbani','Accueil'],'Spending':['Matumizi','Dépenses'],'Advisor':['Mshauri','Conseiller'],'More':['Zaidi','Plus'],'Activity':['Shughuli','Activité'],
'Budgets':['Bajeti','Budgets'],'Bills & reminders':['Bili na vikumbusho','Factures et rappels'],'Bills':['Bili','Factures'],'Lending & borrowing':['Kukopesha na kukopa','Prêts et emprunts'],
'Savings goals':['Malengo ya akiba','Objectifs d\'épargne'],'Investments':['Uwekezaji','Investissements'],'Transport fares':['Nauli za usafiri','Tarifs de transport'],'Family & household':['Familia na kaya','Famille et foyer'],
'WhatsApp bot':['Roboti ya WhatsApp','Robot WhatsApp'],'Scan a receipt':['Changanua risiti','Scanner un reçu'],'Analytics & reports':['Takwimu na ripoti','Analyses et rapports'],'Settings & privacy':['Mipangilio na faragha','Paramètres et confidentialité'],
'Notifications':['Arifa','Notifications'],'Accounts':['Akaunti','Comptes'],'My money profile':['Wasifu wangu wa fedha','Mon profil financier'],'Streaks & rewards':['Mfululizo na zawadi','Séries et récompenses'],
/* common buttons */
'Continue':['Endelea','Continuer'],'Back':['Rudi','Retour'],'Save':['Hifadhi','Enregistrer'],'Cancel':['Ghairi','Annuler'],'Close':['Funga','Fermer'],'Edit':['Hariri','Modifier'],'Delete':['Futa','Supprimer'],'Remove':['Ondoa','Retirer'],
'Add':['Ongeza','Ajouter'],'Done':['Imekamilika','Terminé'],'Skip':['Ruka','Passer'],'Skip for now':['Ruka kwa sasa','Passer pour l\'instant'],'Skip, do this later':['Ruka, fanya baadaye','Passer, plus tard'],'See all':['Ona zote','Tout voir'],'Details':['Maelezo','Détails'],
'Manage':['Simamia','Gérer'],'Update':['Sasisha','Mettre à jour'],'Send':['Tuma','Envoyer'],'Share summary':['Shiriki muhtasari','Partager le résumé'],'Save changes':['Hifadhi mabadiliko','Enregistrer les modifications'],
'Open it':['Ifungue','L\'ouvrir'],'Share (WhatsApp, email, Drive…)':['Shiriki (WhatsApp, barua pepe, Drive…)','Partager (WhatsApp, e-mail, Drive…)'],'Saved':['Imehifadhiwa','Enregistré'],
/* home */
'Net worth · all accounts':['Thamani halisi · akaunti zote','Valeur nette · tous les comptes'],'Spent today':['Matumizi ya leo','Dépensé aujourd\'hui'],'In this cycle':['Katika mzunguko huu','Ce cycle'],'Cycle':['Mzunguko','Cycle'],
'Log expense':['Andika matumizi','Noter une dépense'],'Scan receipt':['Changanua risiti','Scanner un reçu'],'Check fare':['Kagua nauli','Vérifier le tarif'],'Lend / borrow':['Kopesha / kopa','Prêter / emprunter'],
'This cycle\'s budget':['Bajeti ya mzunguko huu','Budget de ce cycle'],'Coming up':['Zinazokuja','À venir'],'All bills':['Bili zote','Toutes les factures'],'Recent activity':['Shughuli za karibuni','Activité récente'],
'Add account':['Ongeza akaunti','Ajouter un compte'],'Ask the advisor':['Muulize mshauri','Demander au conseiller'],'Log an expense':['Andika matumizi','Noter une dépense'],'Start with today':['Anza na leo','Commencez aujourd\'hui'],
'Tracking started. Changes show from tomorrow.':['Ufuatiliaji umeanza. Mabadiliko yataonekana kesho.','Le suivi a commencé. Les changements apparaîtront demain.'],
'No bills yet':['Bado hakuna bili','Pas encore de factures'],'Nothing logged yet':['Bado hakuna kilichoandikwa','Rien de noté pour l\'instant'],'Read my MoMo messages':['Soma jumbe zangu za MoMo','Lire mes messages MoMo'],
'Start a streak today':['Anza mfululizo leo','Commencez une série aujourd\'hui'],'You\'re on pace':['Uko kwenye mwendo mzuri','Vous êtes dans le rythme'],
/* spending */
'Today':['Leo','Aujourd\'hui'],'Yesterday':['Jana','Hier'],'Tomorrow':['Kesho','Demain'],'7 days':['Siku 7','7 jours'],'This cycle':['Mzunguko huu','Ce cycle'],'Last cycle':['Mzunguko uliopita','Cycle précédent'],
'Everything':['Kila kitu','Tout'],'Personal':['Binafsi','Personnel'],'Household':['Kaya','Foyer'],'Per day':['Kwa siku','Par jour'],'Payments':['Malipo','Paiements'],'Biggest':['Kubwa zaidi','Le plus grand'],
'Where the money went':['Pesa zilienda wapi','Où est allé l\'argent'],'Transport':['Usafiri','Transport'],'Health':['Afya','Santé'],'Top places':['Maeneo makuu','Principaux lieux'],'Who it was for':['Ilikuwa kwa ajili ya nani','Pour qui'],
'All transactions':['Miamala yote','Toutes les transactions'],'Check fares':['Kagua nauli','Vérifier les tarifs'],'See these payments':['Ona malipo haya','Voir ces paiements'],'Not specified':['Haijabainishwa','Non précisé'],
'Me':['Mimi','Moi'],'The household':['Kaya','Le foyer'],'Me (personal)':['Mimi (binafsi)','Moi (personnel)'],'The household (shared)':['Kaya (ya pamoja)','Le foyer (partagé)'],
/* add sheet */
'Log a transaction':['Andika muamala','Noter une transaction'],'Quick note':['Kumbukumbu fupi','Note rapide'],'Full form':['Fomu kamili','Formulaire complet'],'Receipt':['Risiti','Reçu'],
'Say it the way you\'d say it':['Sema kama unavyosema kawaida','Dites-le comme vous le diriez'],'Paid with':['Imelipwa kwa','Payé avec'],'For':['Kwa ajili ya','Pour'],'Save expense':['Hifadhi matumizi','Enregistrer la dépense'],
'Type':['Aina','Type'],'Amount':['Kiasi','Montant'],'Description':['Maelezo','Description'],'Category':['Kundi','Catégorie'],'Detail':['Kipengele','Détail'],'Date':['Tarehe','Date'],'Route (transport)':['Njia (usafiri)','Trajet (transport)'],'No route':['Hakuna njia','Aucun trajet'],
'Income':['Mapato','Revenu'],'Loan or advance received':['Mkopo au mkopo wa haraka uliopokelewa','Prêt ou avance reçu'],'Repaying a loan or advance':['Kulipa mkopo au mkopo wa haraka','Remboursement d\'un prêt ou d\'une avance'],
'I lent money':['Nimekopesha pesa','J\'ai prêté de l\'argent'],'I borrowed from a person':['Nimekopa kwa mtu','J\'ai emprunté à une personne'],'Kind of credit':['Aina ya mkopo','Type de crédit'],'Person':['Mtu','Personne'],
'Advance (MoMo Advance, Fuliza…)':['Mkopo wa haraka (MoMo Advance, Fuliza…)','Avance (MoMo Advance, Fuliza…)'],'Loan (MoKash, bank loan…)':['Mkopo (MoKash, mkopo wa benki…)','Prêt (MoKash, prêt bancaire…)'],
/* categories */
'Food & Groceries':['Chakula na mahitaji','Alimentation et courses'],'Utilities':['Huduma za nyumbani','Services publics'],'Airtime & Data':['Muda wa maongezi na data','Crédit et données'],'Rent & Housing':['Kodi na makazi','Loyer et logement'],
'School Fees':['Ada za shule','Frais de scolarité'],'Entertainment':['Burudani','Loisirs'],'Savings':['Akiba','Épargne'],'Business':['Biashara','Entreprise'],'Family Support':['Msaada kwa familia','Soutien familial'],'Personal Care':['Huduma binafsi','Soins personnels'],'Other':['Nyingine','Autre'],
'Groceries & market':['Mahitaji na sokoni','Courses et marché'],'Eating out':['Kula nje','Repas à l\'extérieur'],'Snacks & drinks':['Vitafunio na vinywaji','Snacks et boissons'],'Household supplies':['Vifaa vya nyumbani','Produits ménagers'],
'Boda boda':['Bodaboda','Moto-taxi'],'Taxi (matatu)':['Teksi (matatu)','Taxi collectif'],'Ride-hailing (Uber, Bolt, SafeBoda)':['Usafiri wa programu (Uber, Bolt, SafeBoda)','VTC (Uber, Bolt, SafeBoda)'],'Fuel':['Mafuta','Carburant'],'Bus & long distance':['Basi na safari ndefu','Bus et longue distance'],'Parking & repairs':['Maegesho na matengenezo','Parking et réparations'],
'Electricity':['Umeme','Électricité'],'Water':['Maji','Eau'],'Gas & charcoal':['Gesi na mkaa','Gaz et charbon'],'Rubbish & security':['Taka na ulinzi','Ordures et sécurité'],'Airtime':['Muda wa maongezi','Crédit téléphonique'],'Data bundles':['Vifurushi vya data','Forfaits internet'],'Home internet':['Intaneti ya nyumbani','Internet à domicile'],
'Rent':['Kodi','Loyer'],'Repairs & maintenance':['Matengenezo','Réparations et entretien'],'Furniture & appliances':['Samani na vifaa','Meubles et appareils'],'School fees':['Ada za shule','Frais de scolarité'],'Uniforms, books & supplies':['Sare, vitabu na vifaa','Uniformes, livres et fournitures'],'School transport & lunch':['Usafiri na chakula cha shule','Transport et repas scolaires'],'University & college':['Chuo kikuu na chuo','Université et école supérieure'],
'Pharmacy & medicine':['Duka la dawa na dawa','Pharmacie et médicaments'],'Clinic & hospital':['Kliniki na hospitali','Clinique et hôpital'],'Lab tests':['Vipimo vya maabara','Analyses de laboratoire'],'Dental & eye care':['Meno na macho','Soins dentaires et des yeux'],'Health insurance':['Bima ya afya','Assurance santé'],
'Outings':['Matembezi','Sorties'],'TV & streaming':['TV na utiririshaji','TV et streaming'],'Events & parties':['Matukio na sherehe','Événements et fêtes'],'Sports & hobbies':['Michezo na mambo ya kujifurahisha','Sports et loisirs'],'Betting & lottery':['Kubeti na bahati nasibu','Paris et loterie'],
'SACCO':['SACCO','Coopérative (SACCO)'],'Goal savings':['Akiba ya malengo','Épargne pour objectifs'],'Investment':['Uwekezaji','Investissement'],'Savings group':['Kikundi cha akiba','Groupe d\'épargne'],
'Stock & supplies':['Bidhaa na malighafi','Stock et fournitures'],'Wages':['Mishahara','Salaires'],'Business transport':['Usafiri wa biashara','Transport professionnel'],'Other business costs':['Gharama nyingine za biashara','Autres frais professionnels'],
'Support to parents':['Msaada kwa wazazi','Soutien aux parents'],'Children':['Watoto','Enfants'],'Relatives':['Ndugu','Proches'],'Contributions (weddings, funerals)':['Michango (harusi, misiba)','Contributions (mariages, funérailles)'],
'Hair & salon':['Nywele na saluni','Coiffure et salon'],'Clothes & shoes':['Nguo na viatu','Vêtements et chaussures'],'Toiletries':['Vifaa vya usafi','Produits de toilette'],'Gym & fitness':['Mazoezi','Sport et fitness'],
'Church & giving':['Kanisa na sadaka','Église et dons'],'Mobile money & bank fees':['Ada za pesa za simu na benki','Frais mobile money et banque'],
'Advance received':['Mkopo wa haraka umepokelewa','Avance reçue'],'Loan received':['Mkopo umepokelewa','Prêt reçu'],'Advance repaid':['Mkopo wa haraka umelipwa','Avance remboursée'],'Loan repayment':['Malipo ya mkopo','Remboursement de prêt'],'Lending':['Kukopesha','Prêts'],
/* accounts */
'Mobile money':['Pesa za simu','Mobile money'],'Bank':['Benki','Banque'],'Cash':['Taslimu','Espèces'],'Cash on hand':['Pesa taslimu mkononi','Espèces en main'],'SACCO / savings group':['SACCO / kikundi cha akiba','SACCO / groupe d\'épargne'],
'Add an account':['Ongeza akaunti','Ajouter un compte'],'Edit account':['Hariri akaunti','Modifier le compte'],'Delete account':['Futa akaunti','Supprimer le compte'],'Provider':['Mtoa huduma','Fournisseur'],'Name in Kasente':['Jina ndani ya Kasente','Nom dans Kasente'],
'Currency':['Sarafu','Devise'],'Balance now':['Salio sasa','Solde actuel'],'Advance and loans on this account':['Mikopo ya haraka na mikopo kwenye akaunti hii','Avances et prêts sur ce compte'],'Advance limit':['Kikomo cha mkopo wa haraka','Plafond d\'avance'],'Advance used now':['Mkopo wa haraka uliotumika sasa','Avance utilisée'],
'Loan limit':['Kikomo cha mkopo','Plafond de prêt'],'Loan owed now':['Mkopo unaodaiwa sasa','Prêt dû actuellement'],'Picture (optional)':['Picha (hiari)','Photo (facultatif)'],'Choose picture':['Chagua picha','Choisir une photo'],
'Credit and loans':['Mikopo','Crédit et prêts'],'Advance used':['Mkopo wa haraka uliotumika','Avance utilisée'],'Loan outstanding':['Mkopo uliobaki','Prêt restant'],'Balance minus what you owe':['Salio ukiondoa unachodaiwa','Solde moins ce que vous devez'],
'Advance & loans':['Mikopo ya haraka na mikopo','Avances et prêts'],'Recent':['Za karibuni','Récent'],'Money you can use':['Pesa unazoweza kutumia','Argent disponible'],'All accounts':['Akaunti zote','Tous les comptes'],
'Owed to providers':['Deni kwa watoa huduma','Dû aux fournisseurs'],'Advance still available':['Mkopo wa haraka bado unapatikana','Avance encore disponible'],
/* profile */
'Financial wellness':['Ustawi wa kifedha','Bien-être financier'],'Strong':['Imara','Solide'],'Steady':['Thabiti','Stable'],'Building':['Inajengwa','En progrès'],'Needs attention':['Inahitaji umakini','À surveiller'],
'Saving':['Kuweka akiba','Épargne'],'Safety buffer':['Akiba ya dharura','Réserve de sécurité'],'Debt':['Deni','Dette'],'Budget':['Bajeti','Budget'],'What the score means':['Alama inamaanisha nini','Ce que signifie le score'],
'Net worth':['Thamani halisi','Valeur nette'],'Months of cover':['Miezi ya kujikimu','Mois de couverture'],'Credit available':['Mkopo unaopatikana','Crédit disponible'],'Spend per month':['Matumizi kwa mwezi','Dépenses par mois'],'Income per month':['Mapato kwa mwezi','Revenu par mois'],
'What you have':['Ulicho nacho','Ce que vous avez'],'What you owe':['Unachodaiwa','Ce que vous devez'],'Mobile money, bank and cash':['Pesa za simu, benki na taslimu','Mobile money, banque et espèces'],'SACCO and group savings':['SACCO na akiba ya kikundi','SACCO et épargne de groupe'],
'Money people owe you':['Pesa unazodai watu','Argent qu\'on vous doit'],'Property and other assets':['Mali na rasilimali nyingine','Biens et autres actifs'],'Mobile money advances':['Mikopo ya haraka ya pesa za simu','Avances mobile money'],'Loans from providers':['Mikopo kutoka kwa watoa huduma','Prêts des fournisseurs'],
'Money borrowed from people':['Pesa ulizokopa kwa watu','Argent emprunté à des personnes'],'Nothing owed':['Hakuna deni','Rien à rembourser'],'Property and assets':['Mali na rasilimali','Biens et actifs'],'Add what you own':['Ongeza unachomiliki','Ajoutez ce que vous possédez'],
'Spending habits':['Tabia za matumizi','Habitudes de dépense'],'Get advice based on my profile':['Pata ushauri kulingana na wasifu wangu','Conseils selon mon profil'],'Add an asset':['Ongeza mali','Ajouter un bien'],'Edit asset':['Hariri mali','Modifier le bien'],
'Land':['Ardhi','Terrain'],'House or building':['Nyumba au jengo','Maison ou bâtiment'],'Vehicle or boda':['Gari au bodaboda','Véhicule ou moto'],'Livestock':['Mifugo','Bétail'],'Business or stock':['Biashara au bidhaa','Entreprise ou stock'],'Equipment':['Vifaa','Équipement'],'Jewellery':['Vito','Bijoux'],
'Name':['Jina','Nom'],'Note (optional)':['Maelezo (hiari)','Note (facultatif)'],
/* advisor */
'Ask':['Uliza','Demander'],'Learn':['Jifunze','Apprendre'],'My review':['Tathmini yangu','Mon bilan'],'Ask about your money…':['Uliza kuhusu pesa zako…','Posez une question sur votre argent…'],
'Books worth reading':['Vitabu vinavyofaa kusomwa','Livres à lire'],'Free official resources':['Rasilimali rasmi za bure','Ressources officielles gratuites'],'Your personal review':['Tathmini yako binafsi','Votre bilan personnel'],
'Short, practical notes on managing money, written for life in Africa.':['Maelezo mafupi na ya vitendo kuhusu kusimamia pesa, yaliyoandikwa kwa maisha ya Afrika.','Des notes courtes et pratiques sur la gestion de l\'argent, écrites pour la vie en Afrique.'],
'General education, not regulated financial advice.':['Elimu ya jumla, si ushauri rasmi wa kifedha.','Éducation générale, pas un conseil financier réglementé.'],
'Am I on track this month?':['Je, niko sawa mwezi huu?','Suis-je dans les clous ce mois-ci ?'],'What can I do to be better with money?':['Nifanye nini ili kusimamia pesa vizuri zaidi?','Que puis-je faire pour mieux gérer mon argent ?'],
'How much am I spending on boda per week?':['Ninatumia kiasi gani kwa bodaboda kwa wiki?','Combien je dépense en moto-taxi par semaine ?'],'Why did I run out of money last month?':['Kwa nini pesa ziliisha mwezi uliopita?','Pourquoi ai-je manqué d\'argent le mois dernier ?'],
'How much did I spend on health?':['Nilitumia kiasi gani kwa afya?','Combien ai-je dépensé pour la santé ?'],'Should I buy T-bills or a fixed deposit?':['Ninunue hati fungani za muda mfupi au amana ya muda maalum?','Bons du Trésor ou dépôt à terme ?'],'What is a SACCO and is it worth joining?':['SACCO ni nini na inafaa kujiunga?','Qu\'est-ce qu\'une SACCO et vaut-elle la peine ?'],
'Budgeting when income changes every month':['Kupanga bajeti mapato yanapobadilika kila mwezi','Faire un budget quand le revenu change chaque mois'],'Your emergency fund':['Akiba yako ya dharura','Votre fonds d\'urgence'],
'The real cost of mobile advances and app loans':['Gharama halisi ya mikopo ya simu na ya programu','Le vrai coût des avances mobiles et des prêts par appli'],'Getting out of debt':['Kutoka kwenye madeni','Sortir des dettes'],'SACCOs and savings groups':['SACCO na vikundi vya akiba','SACCO et groupes d\'épargne'],
'Treasury bills and bonds':['Hati fungani za serikali','Bons et obligations du Trésor'],'Unit trusts and money market funds':['Mifuko ya uwekezaji wa pamoja','Fonds communs et fonds monétaires'],'Planning for retirement':['Kupanga kustaafu','Préparer la retraite'],
'Staying safe from money scams':['Kujikinga na utapeli wa pesa','Se protéger des arnaques'],'Supporting family without going broke':['Kusaidia familia bila kufilisika','Aider la famille sans se ruiner'],'Health costs and insurance':['Gharama za afya na bima','Frais de santé et assurance'],
'Planning for school fees':['Kupanga ada za shule','Prévoir les frais de scolarité'],'Keep business and personal money apart':['Tenganisha pesa za biashara na binafsi','Séparer argent professionnel et personnel'],
/* streaks */
'Points':['Pointi','Points'],'Badges':['Beji','Badges'],'Earn points':['Pata pointi','Gagner des points'],'Prizes are coming':['Zawadi zinakuja','Des prix arrivent'],'Recent points':['Pointi za karibuni','Points récents'],
'Open Kasente each day':['Fungua Kasente kila siku','Ouvrez Kasente chaque jour'],'Read a lesson':['Soma somo','Lire une leçon'],'Earn a badge':['Pata beji','Gagner un badge'],
'First entry':['Ingizo la kwanza','Première saisie'],'Full week':['Wiki nzima','Semaine complète'],'Two weeks':['Wiki mbili','Deux semaines'],'Habit formed':['Tabia imejengeka','Habitude prise'],'Budget set':['Bajeti imewekwa','Budget défini'],'Goal setter':['Mweka malengo','Fixeur d\'objectifs'],
'Learner':['Mwanafunzi','Apprenant'],'Owner':['Mmiliki','Propriétaire'],'Safety first':['Usalama kwanza','La sécurité d\'abord'],'Debt free':['Bila deni','Sans dette'],
/* family */
'Set up your household':['Weka kaya yako','Configurer votre foyer'],'Members':['Wanachama','Membres'],'Adult':['Mtu mzima','Adulte'],'Child':['Mtoto','Enfant'],'Household name':['Jina la kaya','Nom du foyer'],
'Who else is in the household?':['Nani mwingine yuko kwenye kaya?','Qui d\'autre fait partie du foyer ?'],'+ Add a person':['+ Ongeza mtu','+ Ajouter une personne'],'Monthly household budget (optional)':['Bajeti ya kaya kwa mwezi (hiari)','Budget mensuel du foyer (facultatif)'],
'Log household expense':['Andika matumizi ya kaya','Noter une dépense du foyer'],'Where household money went':['Pesa za kaya zilienda wapi','Où est allé l\'argent du foyer'],'Shared bills':['Bili za pamoja','Factures partagées'],'Household goals':['Malengo ya kaya','Objectifs du foyer'],
'Give allowance':['Toa posho','Donner l\'argent de poche'],'Allowance':['Posho','Argent de poche'],'Allowance given this cycle':['Posho iliyotolewa mzunguko huu','Argent de poche donné ce cycle'],'Save household':['Hifadhi kaya','Enregistrer le foyer'],'Edit household':['Hariri kaya','Modifier le foyer'],
'Manage money as a household':['Simamia pesa kama kaya','Gérer l\'argent en foyer'],'Shared with household':['Inashirikiwa na kaya','Partagé avec le foyer'],'Record allowance':['Andika posho','Enregistrer l\'argent de poche'],
/* onboarding */
'About you':['Kuhusu wewe','À propos de vous'],'Your accounts':['Akaunti zako','Vos comptes'],'Your household':['Kaya yako','Votre foyer'],'Your account':['Akaunti yako','Votre compte'],'Your name':['Jina lako','Votre nom'],
'Country':['Nchi','Pays'],'Language':['Lugha','Langue'],'Usually paid on':['Kwa kawaida hulipwa tarehe','Payé généralement le'],'Start with':['Anza na','Commencer avec'],'My own money':['Pesa zangu','Mon propre argent'],'Sample data':['Data ya mfano','Données d\'exemple'],
'So Kasente uses your currency, language and pay cycle.':['Ili Kasente itumie sarafu, lugha na mzunguko wako wa malipo.','Pour que Kasente utilise votre devise, votre langue et votre cycle de paie.'],
'Set up your accounts next. Kasente reads your mobile money messages.':['Weka akaunti zako kisha. Kasente husoma jumbe zako za pesa za simu.','Configurez ensuite vos comptes. Kasente lit vos messages mobile money.'],
'Explore with Sarah\'s example month in Uganda.':['Gundua kwa mfano wa mwezi wa Sarah nchini Uganda.','Découvrez avec le mois d\'exemple de Sarah en Ouganda.'],
'Tick the accounts you use and enter what\'s in them today. You can skip this and add them later.':['Weka alama kwenye akaunti unazotumia na uandike kilichomo leo. Unaweza kuruka hili na kuziongeza baadaye.','Cochez les comptes que vous utilisez et indiquez leur solde. Vous pouvez passer cette étape.'],
'Do you manage money for a family? Kasente can keep personal and household spending apart and track allowances for children.':['Je, unasimamia pesa za familia? Kasente inaweza kutenganisha matumizi binafsi na ya kaya na kufuatilia posho za watoto.','Gérez-vous l\'argent d\'une famille ? Kasente peut séparer les dépenses personnelles et du foyer et suivre l\'argent de poche des enfants.'],
'Yes, set up my household':['Ndiyo, weka kaya yangu','Oui, configurer mon foyer'],'Not now, just me':['Si sasa, mimi tu','Pas maintenant, juste moi'],'Set up Kasente':['Weka Kasente','Configurer Kasente'],
'Kasente remembers your money for you':['Kasente inakumbuka pesa zako kwa ajili yako','Kasente se souvient de votre argent pour vous'],'Your MoMo messages become your records':['Jumbe zako za MoMo zinakuwa kumbukumbu zako','Vos messages MoMo deviennent vos relevés'],'Your data stays on your phone':['Data yako inabaki kwenye simu yako','Vos données restent sur votre téléphone'],
'Sign in with Microsoft':['Ingia kwa Microsoft','Se connecter avec Microsoft'],'Google Drive · coming soon':['Google Drive · inakuja hivi karibuni','Google Drive · bientôt'],
'Balance':['Salio','Solde'],
/* settings */
'Account':['Akaunti','Compte'],'Pay cycle':['Mzunguko wa malipo','Cycle de paie'],'Budget limits':['Vikomo vya bajeti','Limites du budget'],'Security':['Usalama','Sécurité'],'App lock':['Kufunga programu','Verrouillage'],
'Change PIN':['Badilisha PIN','Changer le PIN'],'Set a PIN':['Weka PIN','Définir un PIN'],'Mobile money messages':['Jumbe za pesa za simu','Messages mobile money'],'Read money SMS automatically':['Soma SMS za pesa moja kwa moja','Lire automatiquement les SMS d\'argent'],
'Privacy':['Faragha','Confidentialité'],'Backup':['Hifadhi nakala','Sauvegarde'],'Save a backup file':['Hifadhi faili ya nakala','Enregistrer une sauvegarde'],'Restore from a backup':['Rejesha kutoka kwenye nakala','Restaurer une sauvegarde'],
'Appearance':['Mwonekano','Apparence'],'System':['Mfumo','Système'],'Light':['Mwanga','Clair'],'Dark':['Giza','Sombre'],'Your data':['Data yako','Vos données'],'Delete all data':['Futa data yote','Supprimer toutes les données'],
'Country, currency and language':['Nchi, sarafu na lugha','Pays, devise et langue'],'Main currency':['Sarafu kuu','Devise principale'],'Exchange rates':['Viwango vya kubadilisha fedha','Taux de change'],'Export':['Hamisha','Exporter'],
'Excel workbook':['Kitabu cha Excel','Classeur Excel'],'PDF report':['Ripoti ya PDF','Rapport PDF'],'CSV list':['Orodha ya CSV','Liste CSV'],'Claude API key':['Ufunguo wa API wa Claude','Clé API Claude'],'Save key':['Hifadhi ufunguo','Enregistrer la clé'],
'Budget alert at':['Tahadhari ya bajeti kwa','Alerte budget à'],'Bill and loan reminders':['Vikumbusho vya bili na mikopo','Rappels de factures et prêts'],'Lock Kasente now':['Funga Kasente sasa','Verrouiller Kasente'],'Replay the welcome tour':['Rudia ziara ya ukaribisho','Revoir la visite d\'accueil'],
'Enter your PIN':['Weka PIN yako','Saisissez votre PIN'],
/* more */
'You':['Wewe','Vous'],'Money':['Pesa','Argent'],'Learn and report':['Jifunze na ripoti','Apprendre et rapports'],'Capture':['Kunasa','Saisie'],'App':['Programu','Appli'],'SMS reader':['Kisomaji cha SMS','Lecteur de SMS'],
/* bills and goals */
'Upcoming':['Zinazokuja','À venir'],'Late':['Imechelewa','En retard'],'Paid':['Imelipwa','Payé'],'Add a bill':['Ongeza bili','Ajouter une facture'],'Add bill':['Ongeza bili','Ajouter une facture'],'Due today':['Inadaiwa leo','Échéance aujourd\'hui'],
'Mark as paid':['Weka kuwa imelipwa','Marquer comme payé'],'Remind me tomorrow':['Nikumbushe kesho','Me le rappeler demain'],'Bill type':['Aina ya bili','Type de facture'],'Repeats':['Inajirudia','Se répète'],'Monthly':['Kila mwezi','Mensuel'],'Every term':['Kila muhula','Chaque trimestre'],'Yearly':['Kila mwaka','Annuel'],'Once':['Mara moja','Une fois'],
'Next due':['Tarehe ijayo','Prochaine échéance'],'New goal':['Lengo jipya','Nouvel objectif'],'Add money':['Ongeza pesa','Ajouter de l\'argent'],'On track':['Iko sawa','Dans les temps'],'Behind':['Nyuma','En retard'],'Target date':['Tarehe ya lengo','Date cible'],
'Needed per month':['Inahitajika kwa mwezi','Nécessaire par mois'],'New savings goal':['Lengo jipya la akiba','Nouvel objectif d\'épargne'],'Goal name':['Jina la lengo','Nom de l\'objectif'],'Create goal':['Unda lengo','Créer l\'objectif'],
'Outstanding':['Inayodaiwa','En cours'],'Settled':['Imelipwa','Réglé'],'Owed to you':['Unachodai','On vous doit'],'You owe':['Unadaiwa','Vous devez'],'Net':['Halisi','Net'],'Record a loan':['Andika mkopo','Enregistrer un prêt'],
'Record money lent or borrowed':['Andika pesa ulizokopesha au kukopa','Enregistrer de l\'argent prêté ou emprunté'],'I borrowed':['Nimekopa','J\'ai emprunté'],'Pay back by':['Lipa kufikia','Rembourser avant le'],
/* receipt */
'Take a photo of the receipt':['Piga picha ya risiti','Photographier le reçu'],'Open camera':['Fungua kamera','Ouvrir l\'appareil photo'],'Choose a photo you already took':['Chagua picha uliyopiga tayari','Choisir une photo déjà prise'],'Try a sample receipt':['Jaribu risiti ya mfano','Essayer un reçu d\'exemple'],
'No receipt? Type it.':['Huna risiti? Iandike.','Pas de reçu ? Tapez-le.'],'Reading your receipt…':['Inasoma risiti yako…','Lecture de votre reçu…'],'Shop':['Duka','Magasin'],'Items':['Bidhaa','Articles'],'+ Add item':['+ Ongeza bidhaa','+ Ajouter un article'],'Total to save':['Jumla ya kuhifadhi','Total à enregistrer'],
'Scan another':['Changanua nyingine','Scanner un autre'],'Use this':['Tumia hii','Utiliser'],'Text read from the receipt':['Maandishi yaliyosomwa kwenye risiti','Texte lu sur le reçu'],
/* analytics */
'Spending by category':['Matumizi kwa kundi','Dépenses par catégorie'],'Income vs spending':['Mapato dhidi ya matumizi','Revenus et dépenses'],'Daily spending':['Matumizi ya kila siku','Dépenses quotidiennes'],'Reports':['Ripoti','Rapports'],
'Monthly summary':['Muhtasari wa mwezi','Résumé mensuel'],'Annual overview':['Muhtasari wa mwaka','Vue annuelle'],'Custom date range':['Kipindi maalum','Période personnalisée'],
/* misc */
'Transaction':['Muamala','Transaction'],'Edit details':['Hariri maelezo','Modifier les détails'],'Delete transaction':['Futa muamala','Supprimer la transaction'],'Original message':['Ujumbe wa asili','Message original'],'When':['Lini','Quand'],'Captured from':['Imenaswa kutoka','Source'],
'Mark all as read':['Weka zote kuwa zimesomwa','Tout marquer comme lu'],'Categories':['Makundi','Catégories'],'New category':['Kundi jipya','Nouvelle catégorie'],'Save limit':['Hifadhi kikomo','Enregistrer la limite'],
'Did I pay a fair price?':['Je, nililipa bei nzuri?','Ai-je payé un prix juste ?'],'Ride':['Safari','Trajet'],'Route':['Njia','Trajet'],'Log this ride':['Andika safari hii','Noter ce trajet'],'Fare reference':['Marejeo ya nauli','Tarifs de référence'],'Add route':['Ongeza njia','Ajouter un trajet'],
'Holdings':['Mali za uwekezaji','Placements'],'Add holding':['Ongeza uwekezaji','Ajouter un placement'],'Learn the options':['Jifunze chaguo','Découvrir les options'],'Portfolio value':['Thamani ya uwekezaji','Valeur du portefeuille'],
'Check':['Kagua','Vérifier'],'It\'s right':['Iko sawa','C\'est correct'],'Read from message':['Imesomwa kutoka ujumbe','Lu depuis le message'],'Log this transaction':['Andika muamala huu','Noter cette transaction'],'Message':['Ujumbe','Message'],
'Search transactions':['Tafuta miamala','Rechercher des transactions'],'All':['Zote','Tout'],'Money out':['Pesa zilizotoka','Sorties'],'Money in':['Pesa zilizoingia','Entrées'],'Logged ✓':['Imeandikwa ✓','Enregistré ✓'],
'Spent':['Imetumika','Dépensé'],'Your first name':['Jina lako la kwanza','Votre prénom'],'Kiswahili':['Kiswahili','Kiswahili'],
'Sign in with your Microsoft email so your data is kept in your own OneDrive and comes back if you change phones.':['Ingia kwa barua pepe yako ya Microsoft ili data yako ihifadhiwe kwenye OneDrive yako na irudi ukibadilisha simu.','Connectez-vous avec votre e-mail Microsoft pour garder vos données dans votre propre OneDrive et les retrouver si vous changez de téléphone.'],
'Sign-in isn\'t switched on in this test build yet. Your data stays on this phone for now.':['Kuingia bado hakujawashwa katika toleo hili la majaribio. Data yako inabaki kwenye simu hii kwa sasa.','La connexion n\'est pas encore activée dans cette version de test. Vos données restent sur ce téléphone pour l\'instant.'],
'Sample data loaded. Switch to your own data in Settings.':['Data ya mfano imepakiwa. Badilisha kuwa data yako kwenye Mipangilio.','Données d\'exemple chargées. Passez à vos données dans Paramètres.'],
'Changes saved':['Mabadiliko yamehifadhiwa','Modifications enregistrées'],'Transaction deleted':['Muamala umefutwa','Transaction supprimée'],'Account saved':['Akaunti imehifadhiwa','Compte enregistré'],'Household saved':['Kaya imehifadhiwa','Foyer enregistré'],
'Monday':['Jumatatu','lundi'],'Tuesday':['Jumanne','mardi'],'Wednesday':['Jumatano','mercredi'],'Thursday':['Alhamisi','jeudi'],'Friday':['Ijumaa','vendredi'],'Saturday':['Jumamosi','samedi'],'Sunday':['Jumapili','dimanche']};
const T_MONTHS={January:['Januari','janvier'],February:['Februari','février'],March:['Machi','mars'],April:['Aprili','avril'],May:['Mei','mai'],June:['Juni','juin'],July:['Julai','juillet'],August:['Agosti','août'],September:['Septemba','septembre'],October:['Oktoba','octobre'],November:['Novemba','novembre'],December:['Desemba','décembre']};
const T_PAT=[
 [/^(\d+) days left$/,['Siku $1 zimebaki','Il reste $1 jours']],[/^1 day left$/,['Siku 1 imebaki','Il reste 1 jour']],
 [/^Day (\d+) of (\d+)$/,['Siku $1 kati ya $2','Jour $1 sur $2']],[/^(\d+)-day streak$/,['Mfululizo wa siku $1','Série de $1 jours']],
 [/^(\d+) points · (\d+) badges?$/,['Pointi $1 · beji $2','$1 points · $2 badges']],[/^Oli otya, (.+)$/,['Habari, $1','Bonjour, $1']],
 [/^Step (\d) of (\d)$/,['Hatua $1 kati ya $2','Étape $1 sur $2']],[/^In (\d+) days?$/,['Baada ya siku $1','Dans $1 jours']],[/^(\d+) days? late$/,['Imechelewa siku $1','En retard de $1 j']],
 [/^Due (.+)$/,['Inadaiwa $1','Échéance $1']],
 [/^Day (\d+) of your streak · \+(\d+) points$/,['Siku ya $1 ya mfululizo · pointi +$2','Jour $1 de votre série · +$2 points']],[/^(\d+) min read$/,['Dakika $1 kusoma','$1 min de lecture']],
 [/^1 payment$/,['Malipo 1','1 paiement']],[/^(\d+)% · 1 payment$/,['$1% · malipo 1','$1 % · 1 paiement']],
 [/^The (\d+)(st|nd|rd|th)( of the month)?$/,['Tarehe $1','Le $1']],
 [/^(\d+) items? read from your messages$/,['Vipengele $1 vimesomwa kutoka kwenye jumbe zako','$1 éléments lus dans vos messages']],
 [/^(\d+) items? read from your messages\. (\d+) to check$/,['Vipengele $1 vimesomwa kutoka kwenye jumbe zako. $2 vya kukagua','$1 éléments lus dans vos messages. $2 à vérifier']],
 [/^Saved (.+) · (.+)$/,['Imehifadhiwa $1 · $2','Enregistré $1 · $2']],
 [/^Welcome, (.+)\. Set your budget limits under More → Budgets\.$/,['Karibu, $1. Weka vikomo vya bajeti kwenye Zaidi → Bajeti.','Bienvenue, $1. Définissez vos limites dans Plus → Budgets.']],
 [/^(\d+) payments?$/,['Malipo $1','$1 paiements']],[/^(\d+)% · (\d+) payments?$/,['$1% · malipo $2','$1 % · $2 paiements']],
 [/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) (\d+) (January|February|March|April|May|June|July|August|September|October|November|December)$/,null]];
const LI=()=>({sw:0,fr:1}[((typeof S!=='undefined'&&S.settings&&S.settings.lang))||'en']);
function tr(text){const li=LI();if(li===undefined)return null;const k=text.trim();if(!k)return null;
 const d=T_DICT[k];if(d)return d[li];
 for(const[re,out]of T_PAT){const m=k.match(re);if(!m)continue;if(!out){const days=T_DICT[m[1]],mo=T_MONTHS[m[3]];return `${days?days[li]:m[1]} ${m[2]} ${mo?mo[li]:m[3]}`}return k.replace(re,out[li])}
 if(k.includes(' · ')){const parts=k.split(' · ');let changed=false;const o=parts.map(p=>{const t=T_DICT[p.trim()];if(t){changed=true;return t[li]}return p});if(changed)return o.join(' · ')}
 if(/→$/.test(k)){const t=T_DICT[k.replace(/\s*→$/,'')];if(t)return t[li]+' →'}
 return null}
const SKIP_SEL='.mono,.ocr-line,script,style,textarea,input,[data-act="tx"] .tx-title,.acct-head';
function i18nNode(n){const p=n.parentElement;if(!p||p.closest(SKIP_SEL))return;if(n.__en===undefined)n.__en=n.nodeValue;const en=n.__en;
 const li=LI();if(li===undefined){if(n.nodeValue!==en)n.nodeValue=en;return}
 const t=tr(en);const v=t?en.replace(en.trim(),t):en;if(n.nodeValue!==v)n.nodeValue=v}
function i18nAttrs(el){if(!el.getAttribute)return;['placeholder','aria-label'].forEach(a=>{if(!el.hasAttribute(a))return;const key='data-en-'+a;if(!el.hasAttribute(key))el.setAttribute(key,el.getAttribute(a));const en=el.getAttribute(key);const t=LI()===undefined?null:tr(en);if(el.getAttribute(a)!==(t||en))el.setAttribute(a,t||en)})}
window.i18nApply=function(root){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))i18nNode(n);if(root.querySelectorAll)root.querySelectorAll('[placeholder],[aria-label]').forEach(i18nAttrs);
 document.documentElement.lang=((typeof S!=='undefined'&&S.settings&&S.settings.lang))||'en'};
let i18nBusy=false;
new MutationObserver(ms=>{if(i18nBusy||LI()===undefined)return;i18nBusy=true;
 try{ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===3)i18nNode(n);else if(n.nodeType===1){i18nApply(n);i18nAttrs(n)}}))}finally{i18nBusy=false}})
 .observe(document.getElementById('phone'),{childList:true,subtree:true});
