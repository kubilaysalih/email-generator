import React from 'react';
import Head from 'next/head';
import EmailGenerator from '../components/EmailGenerator';
import { defaultMjmlCode } from '~/utils/mjmlConstants';
import dynamic from 'next/dynamic';
import Editor from '~/components/Editor';

// Client-side only olarak EditorBlock komponentini yükle
const ClientSideEditorBlock = dynamic(() => Promise.resolve(Editor), {
  ssr: false
});

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>MJML E-posta Oluşturucu</title>
        <meta name="description" content="Claude AI ile MJML E-posta Oluşturucu" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <EmailGenerator defaultMjmlCode={defaultMjmlCode} />

      {/* EditorJS için ekstra div */}
      <ClientSideEditorBlock />
    </div>
  );
}