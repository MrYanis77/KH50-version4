export interface DirectusSchema {
  memorial_person: MemorialPersonRow;
  memory_fragment: MemoryFragmentRow;
}

export interface MemorialPersonRow {
  id: number;
  status: string;
  first_name: string;
  last_name: string;
  image_src?: string;
  sex?: string;
  birth_place?: string;
  birth_date?: string;
  death_place?: string;
  death_date?: string;
  profession?: string;
  family_origin?: string;
  date_created?: string;
}

export interface MemoryFragmentRow {
  id: number;
  status: string;
  memorial_person_id: number;
  author: string;
  fragment_date: string;
  type: "testimony" | "photograph" | "video" | "story" | "document" | "place";
  description: string;
  file_id?: string;
  date_created?: string;
}