


export const metadata = {
  title: 'Αρχική | Ququiz',
  description: 'Δημιουργήστε και παίξτε κουίζ εύκολα και γρήγορα με το Ququiz!',
}


export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Καλωσήρθατε στο Ququiz!</h1>
      <p className="text-lg mb-6">
        Το Ququiz είναι η πλατφόρμα για να δημιουργείτε διασκεδαστικά κουίζ και να βλέπετε live αποτελέσματα.
      </p>

      <div className="text-left">
        <h2 className="text-2xl font-semibold mb-2">Πώς λειτουργεί:</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Δημιουργήστε ένα νέο Quiz μέσω της επιλογής "Δημιουργία Quiz".</li>
          <li>Μοιραστείτε τον σύνδεσμο συμμετοχής με άλλους.</li>
          <li>Παρακολουθήστε live ποιοι παίκτες απαντούν.</li>
          <li>Δείτε τον πίνακα κατάταξης στο τέλος!</li>
        </ul>
      </div>
    </main>
  )
}
