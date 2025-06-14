Ανάπτυξη Διαδικτυακής Εκπαιδευτικής Πλατφόρμας για Απάντηση Ερωτήσεων

Υπεύθυνος καθηγητής: Σγάρμπας Κυριάκος

Η παρούσα διπλωματική εργασία παρουσιάζει τη σχεδίαση και την υλοποίηση της διαδικτυακής πλατφόρμας «Ququiz», ενός προηγμένου συστήματος quiz που υποστηρίζει πολλαπλούς παίκτες και συγχρονισμένη απάντηση σε ερωτήσεις σε πραγματικό χρόνο. Η πλατφόρμα σχεδιάστηκε με στόχο να προσφέρει μια διαδραστική, άμεση και ευέλικτη εμπειρία quiz, κατάλληλη τόσο για εκπαιδευτικά όσο και για ψυχαγωγικά περιβάλλοντα. Το ququiz απευθύνεται σε χρήστες που επιθυμούν να οργανώσουν ή να συμμετάσχουν σε quiz με έμφαση στη ροή και στον συγχρονισμό, όπου η κάθε ερώτηση εμφανίζεται ταυτόχρονα σε όλους τους συμμετέχοντες και απαντάται εντός προκαθορισμένου χρονικού πλαισίου.
Η αρχιτεκτονική της εφαρμογής βασίζεται σε σύγχρονες τεχνολογίες του οικοσυστήματος JavaScript. Το frontend έχει υλοποιηθεί με Next.js, παρέχοντας γρήγορη απόκριση και δυναμική απόδοση περιεχομένου, ενώ για το backend χρησιμοποιείται το Supabase, που εξασφαλίζει real-time λειτουργικότητα, ασφάλεια και αποθήκευση δεδομένων με PostgreSQL. Η εφαρμογή ενσωματώνει WebSockets, subscriptions και remote procedure calls (RPC) για τον άμεσο συγχρονισμό ενεργειών μεταξύ host και παικτών. Η ροή του παιχνιδιού ελέγχεται αποκλειστικά από τον host, ο οποίος εκκινεί τις ερωτήσεις, παρακολουθεί τις απαντήσεις και παρουσιάζει στατιστικά κατά τη διάρκεια και στο τέλος του quiz.
Ιδιαίτερη έμφαση δίνεται στη βελτιστοποίηση της εμπειρίας του χρήστη (UI/UX), καθώς και στη σταθερότητα και κλιμάκωση της εφαρμογής για πολλαπλούς συμμετέχοντες. Το σύστημα έχει δοκιμαστεί εκτενώς και προσφέρει δυνατότητες επεκτασιμότητας και παραμετροποίησης για διαφορετικά σενάρια χρήσης. Μέσω της μελέτης περίπτωσης του ququiz, αναδεικνύονται τεχνικές προκλήσεις, λύσεις σχεδιασμού real-time εφαρμογών και η εφαρμογή τους σε σύγχρονες ψηφιακές ανάγκες.
Ο κώδικας της εφαρμογής βρίσκεται εδώ: https://github.com/kontman/Diplomatiki.git
Βίντεο 3 Minute thesis μπορείτε να δείτε εδώ: https://youtu.be/vNQMTc-OxHI
Βίντεο με αναλυτική παρουσίαση της πλατφόρμας: https://youtu.be/2vViLa6LypI

Λέξεις κλειδιά: Διαδικτυακή Πλατφόρμα Ερωτήσεων, Διαχειριστής, Παίκτης, Next.js, Supabase, Real-time επικοινωνία


Για την εγκατάσταση απαιτούνται:
•	Node.js (έκδοση 18+)
•	npm (περιλαμβάνεται με το Node)
•	Git
•	Λογαριασμός στο Supabase
•	(Προαιρετικά) VS Code ή άλλο code editor


1.	Άνοιξε ένα τερματικό (Terminal).
2.	Εκτέλεσε την εντολή:
git clone https://github.com/kontman/Diplomatiki.git
cd ququiz_1

3. Εκτέλεσε την εντολή:
npm install

4.  Συνδέσου στο Supabase.
    Δημιούργησε νέο project.
    Αντιγράψε τα κλειδιά SUPABASE_URL και SUPABASE_ANON_KEY.

5.  Στην ρίζα του project, δημιούργησε αρχείο .env.local με το εξής περιεχόμενο:

    NEXT_PUBLIC_SUPABASE_URL= το link που θα βρείτε στο supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
    Data API όπου βρίσκεται το project url (supabase_url)
    API keys όπου αντιγράφετε το πάνω κλειδί (anon key)

6.  Εκκίνηση Εφαρμογής
    Στο terminal:
    npm run dev
    Η εφαρμογή θα τρέχει τοπικά στη διεύθυνση:    http://localhost:3000
