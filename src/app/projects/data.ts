export type ProjectInput = {
  name: string;
  client: string;
  description: string;
};

export type Project = {
  id: string;
  name: string;
  client: string;
  status: string;
  description: string;
};

export const projects: Project[] = [
  {
    id: "brand-identity",
    name: "Brand identity",
    client: "Maji Studio",
    status: "Awaiting feedback",
    description:
      "Logo, color palette, and typography for Maji Studio's new identity.",
  },
  {
    id: "website-homepage",
    name: "Website homepage",
    client: "Northline",
    status: "Approved",
    description:
      "A homepage concept introducing Northline's services and guiding visitors to get in touch.",
  },
];
