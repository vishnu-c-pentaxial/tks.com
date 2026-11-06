import { lazy } from 'react';
import manifest from '../../site/pages/manifest.json';

const HomePage = lazy(() => import('./home/Page.jsx'));
const Pricing = lazy(() => import('./pricing/Page.jsx'));
const About2 = lazy(() => import('./about2/Page.jsx'));
const Contact = lazy(() => import('./contact/Page.jsx'));
const Booking = lazy(() => import('./booking/Page.jsx'));
const ManagedItServices = lazy(() => import('./managed-it-services/Page.jsx'));
const ServiceBackupRecovery = lazy(() => import('./service-backup-recovery/Page.jsx'));
const ServiceItConsulting = lazy(() => import('./service-it-consulting/Page.jsx'));
const ServiceMicrosoft365Services = lazy(() => import('./service-microsoft-365-services/Page.jsx'));
const ServiceCloudInfrastructure = lazy(() => import('./service-cloud-infrastructure/Page.jsx'));
const ServiceWebDesignDevelopment = lazy(() => import('./service-web-design-development/Page.jsx'));
const ServiceManagedCybersecurity = lazy(() => import('./service-managed-cybersecurity/Page.jsx'));
const ServiceNetworkManagement = lazy(() => import('./service-network-management/Page.jsx'));
const ServiceDigitalMarketing = lazy(() => import('./service-digital-marketing/Page.jsx'));

const COMPONENTS = {
  'home': HomePage,
  'pricing': Pricing,
  'about2': About2,
  'contact': Contact,
  'booking': Booking,
  'managed-it-services': ManagedItServices,
  'service-backup-recovery': ServiceBackupRecovery,
  'service-it-consulting': ServiceItConsulting,
  'service-microsoft-365-services': ServiceMicrosoft365Services,
  'service-cloud-infrastructure': ServiceCloudInfrastructure,
  'service-web-design-development': ServiceWebDesignDevelopment,
  'service-managed-cybersecurity': ServiceManagedCybersecurity,
  'service-network-management': ServiceNetworkManagement,
  'service-digital-marketing': ServiceDigitalMarketing,
};

export const ROUTES = manifest.map((entry) => ({
  ...entry,
  Component: COMPONENTS[entry.slug],
}));

export const Home = COMPONENTS.home;
