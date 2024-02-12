import React from 'react';
import Breadcrumbs from '../../components/breadcrumbs';
import Navigation from '../../components/navigation';
import ShellLayout from '../../layouts/shell';
import VariationsTable from './components/question-table';

export default function App() {
  return (
    <ShellLayout
      contentType="table"
      breadcrumbs={<Breadcrumbs active={{ text: 'Question Bank', href: '/tablepage/index.html' }} />}
      navigation={<Navigation />}
    >
      <VariationsTable />
    </ShellLayout>
  );
}