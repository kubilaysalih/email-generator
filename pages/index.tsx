import React from 'react';
import Head from 'next/head';
import EmailGenerator from '../components/EmailGenerator';
import { defaultMjmlCode } from '../utils/mjmlUtils';

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>MJML E-posta Oluşturucu</title>
        <meta name="description" content="Claude AI ile MJML E-posta Oluşturucu" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <EmailGenerator defaultMjmlCode={defaultMjmlCode} />
    </div>
  );
}