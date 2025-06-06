import Link from 'next/link'

export const metadata = {
  title: 'Αρχική | Ququiz',
  description: 'Εκπαιδευτικά quiz για την τάξη ή την εξ αποστάσεως μάθηση – εύκολα και διαδραστικά!',
}

export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Καλωσήρθατε στο Ququiz!</h1>
      <p className="text-lg mb-6">
        Το Ququiz είναι μια εκπαιδευτική πλατφόρμα για τη δημιουργία διαδραστικών quiz που ενισχύουν τη μάθηση μέσα από τη συμμετοχή.
      </p>

      <div className="text-left">
        <h2 className="text-2xl font-semibold mb-2">Πώς λειτουργεί:</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Δημιουργήστε εκπαιδευτικά quiz εύκολα μέσα από το περιβάλλον του Ququiz.</li>
          <li>Μοιραστείτε τον κωδικό συμμετοχής με τους μαθητές σας.</li>
          <li>Παρακολουθήστε σε πραγματικό χρόνο ποιοι μαθητές απαντούν.</li>
          <li>Δώστε έμφαση στην κατανόηση μέσω του πίνακα κατάταξης και της άμεσης ανατροφοδότησης.</li>
        </ul><br/>
        <h2>Δείτε τις ανατυλικές οδηγίες <strong><Link href="/instructions" className="text-xl text-blue-700" >ΕΔΩ!</Link></strong></h2>
      </div>
    </main>
  )
}