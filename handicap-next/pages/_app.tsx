import { MantineProvider } from '@mantine/core';
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider
      theme={{
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        primaryColor: 'indigo',
        defaultRadius: 'lg',
        colors: {
          indigo: [
            '#f0f4ff', '#dbeafe', '#a5b4fc', '#818cf8', '#6366f1',
            '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e1b4b'
          ],
        },
      }}
    >
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </MantineProvider>
  );
}

export default MyApp; 