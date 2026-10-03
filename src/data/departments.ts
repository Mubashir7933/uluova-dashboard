export type Department = {
    name: string;
    slug: string;
    description: string;
    operations: string[];
  };
  
  export const departments: Department[] = [
    {
      name: "Bakım",
      slug: "bakim",
      description:
        "Ekipman arızalarını ve ekipman transferlerini yönetin.",
      operations: [
        "Ekipman Arıza Bildirimi",
        "Ekipman Transfer Bildirimi",
      ],
    },
    {
      name: "İnsan Kaynakları",
      slug: "insan-kaynaklari",
      description:
        "Personel transfer işlemlerini yönetin.",
      operations: [
        "Personel Transfer Bildirimi",
      ],
    },
    {
      name: "İş Sağlığı ve Güvenliği",
      slug: "isg",
      description:
        "İş kazası, ramak kala ve güvenlik olaylarını kaydedin.",
      operations: [
        "İSG Olay Bildirimi",
      ],
    },
  ];
  
  export function getDepartmentBySlug(slug: string) {
    return departments.find(
      (department) => department.slug === slug
    );
  }