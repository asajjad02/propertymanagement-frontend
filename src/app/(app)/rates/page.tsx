import { redirect } from 'next/navigation';

/** Rates were merged into Configuration. Keep the old path working. */
export default function RatesPage() {
  redirect('/configuration');
}
