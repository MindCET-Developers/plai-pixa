export type ImagesLevel = "beginners" | "advanced" | "experts" | "mine";
export type BankLevel = "beginners" | "advanced" | "experts";

export type AdminImage = {
  id: string;
  url_text: string;
  prompt_text: string;
  level_option_images_level: ImagesLevel;
  back_boolean: boolean;
};
