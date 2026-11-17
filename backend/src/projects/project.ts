export type Project = {
  id: string;
  name: string;
  client: string;
  status: "Awaiting feedback" | "Approved";
  description: string;
};
