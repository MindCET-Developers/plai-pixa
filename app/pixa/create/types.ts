export type ImagesLevel = "beginners" | "advanced" | "experts" | "mine";

export type BankImage = {
  id: string;
  url_text: string;
  pic_image: string | null;
  prompt_text: string;
  level_option_images_level: ImagesLevel;
};

export type CreatedGame = {
  id: string;
  id_number: number;
};
