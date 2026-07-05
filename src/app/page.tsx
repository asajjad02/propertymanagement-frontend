import { redirect } from 'next/navigation';

/** The app has no dedicated home; send users to the default landing (flats). */
export default function RootPage() {
  redirect('/flats');
}
