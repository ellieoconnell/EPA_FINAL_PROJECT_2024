import React from 'react';
import BreadcrumbGroup, { BreadcrumbGroupProps } from '@cloudscape-design/components/breadcrumb-group';

const items: BreadcrumbGroupProps.Item[] = [
  //{text: 'Home', href: '/home/index.html'},
  {text: 'Interview Questions', href: '/tablepage/index.html'},
];

export interface BreadcrumbsProps {
  active: BreadcrumbGroupProps.Item;
}

export default function Breadcrumbs({ active }: BreadcrumbsProps) {
  return <BreadcrumbGroup items={[...items, active]} />;
}
