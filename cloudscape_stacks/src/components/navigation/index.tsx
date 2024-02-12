import React from 'react';
import SideNavigation, { SideNavigationProps } from '@cloudscape-design/components/side-navigation';

const items: SideNavigationProps['items'] = [
  //{ type: 'link', text: 'Home', href: 'index.html'},
  { type: 'link', text: 'Question Bank', href: '/tablepage/index.html'},
  { type: 'link', text: ' Create a Question', href: '/put-question/index.html'}
];

export default function Navigation() {
  return (
    <>
      <SideNavigation
        activeHref={location.pathname}
        header={{ href: 'index.html', text: 'Navigation' }}
        items={items}
      />
    </>
  );
}