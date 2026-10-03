export type Site = {
    id: number;
    name: string;
    slug: string;
  };
  
  export const sites: Site[] = [
    {
      id: 1,
      name: "İvrindi",
      slug: "ivrindi",
    },
    {
      id: 2,
      name: "Yeniköy",
      slug: "yenikoy",
    },
    {
      id: 3,
      name: "Parke Bordür",
      slug: "parke-bordur",
    },
    {
      id: 4,
      name: "Beton Santrali",
      slug: "beton-santrali",
    },
    {
      id: 5,
      name: "Sarıbeyler",
      slug: "saribeyler",
    },
    {
      id: 6,
      name: "Karaman Köy",
      slug: "karaman-koy",
    },
    {
      id: 7,
      name: "Üçpınar",
      slug: "ucpinar",
    },
    {
      id: 8,
      name: "Çayüstü",
      slug: "cayustu",
    },
  ];
  
  export function getSiteBySlug(slug: string) {
    return sites.find((site) => site.slug === slug);
  }