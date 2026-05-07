import { VisionType } from '../types/tee';

export const VISION_TYPES: VisionType[] = [
  { id: 'normal', label: 'editor.constants.vision.normal', filter: 'none' },
  { id: 'protanopia', label: 'editor.constants.vision.protanopia', filter: 'url(#protanopia)' },
  { id: 'deuteranopia', label: 'editor.constants.vision.deuteranopia', filter: 'url(#deuteranopia)' },
  { id: 'tritanopia', label: 'editor.constants.vision.tritanopia', filter: 'url(#tritanopia)' },
  { id: 'achromatopsia', label: 'editor.constants.vision.achromatopsia', filter: 'grayscale(100%)' },
];

export const DEFAULT_FONTS = [
  'Inter', 'Montserrat', 'Poppins', 'Arial', 'Helvetica', 
  'Times New Roman', 'Courier New', 'Georgia', 'Roboto', 
  'Open Sans', 'Lato', 'Oswald', 'Raleway', 'Nunito',
  'Josefin Sans', 'Space Mono', 'DM Sans', 'Fraunces',
  'Syne', 'Lora'
];

export const DEFAULT_IMAGE_QUERY = 'Animal, Brazil, Car, Food';
export const DEFAULT_ICON_QUERY = 'ui icon';
export const GEMINI_COOLDOWN = 1000;
export const GRID_SIZE = 50;

export const UNITS = [
  { id: 'px', label: 'editor.constants.units.px', factor: 1 },
  { id: 'in', label: 'editor.constants.units.in', factor: 96 },
  { id: 'cm', label: 'editor.constants.units.cm', factor: 37.7952755906 },
  { id: 'mm', label: 'editor.constants.units.mm', factor: 3.77952755906 },
  { id: 'pt', label: 'editor.constants.units.pt', factor: 1.33333333333 },
  { id: 'pc', label: 'editor.constants.units.pc', factor: 16 },
  { id: 'percent', label: 'editor.constants.units.percent', factor: 1 }
];

export const CANVAS_PRESETS = [
  { id: 'custom', label: 'editor.constants.presets.custom', category: 'editor.constants.categories.custom' },
  { id: 'infinite', label: 'editor.constants.presets.infinite', category: 'editor.constants.categories.custom' },
  { id: 'iphone-16-pro', label: 'editor.constants.presets.iphone_16_pro', width: 402, height: 874, category: 'editor.constants.categories.ui_ux' },
  { id: 'iphone-16-pro-max', label: 'editor.constants.presets.iphone_16_pro_max', width: 440, height: 956, category: 'editor.constants.categories.ui_ux' },
  { id: 'iphone-se', label: 'editor.constants.presets.iphone_se', width: 375, height: 667, category: 'editor.constants.categories.ui_ux' },
  { id: 'samsung-s24', label: 'editor.constants.presets.samsung_s24', width: 360, height: 780, category: 'editor.constants.categories.ui_ux' },
  { id: 'google-pixel-9', label: 'editor.constants.presets.google_pixel_9', width: 412, height: 915, category: 'editor.constants.categories.ui_ux' },
  { id: 'ipad-pro-11', label: 'editor.constants.presets.ipad_pro_11', width: 834, height: 1194, category: 'editor.constants.categories.ui_ux' },
  { id: 'ipad-pro-13', label: 'editor.constants.presets.ipad_pro_13', width: 1024, height: 1366, category: 'editor.constants.categories.ui_ux' },
  { id: 'ipad-air', label: 'editor.constants.presets.ipad_air', width: 820, height: 1180, category: 'editor.constants.categories.ui_ux' },
  { id: 'android-tablet', label: 'editor.constants.presets.android_tablet', width: 800, height: 1280, category: 'editor.constants.categories.ui_ux' },
  { id: 'apple-watch-ultra', label: 'editor.constants.presets.apple_watch_ultra', width: 205, height: 251, category: 'editor.constants.categories.ui_ux' },
  { id: 'apple-watch-45mm', label: 'editor.constants.presets.apple_watch_45mm', width: 198, height: 242, category: 'editor.constants.categories.ui_ux' },
  { id: 'desktop-hd', label: 'editor.constants.presets.desktop_hd', width: 1920, height: 1080, category: 'editor.constants.categories.ui_ux' },
  { id: 'desktop', label: 'editor.constants.presets.desktop', width: 1440, height: 900, category: 'editor.constants.categories.ui_ux' },
  { id: 'macbook-pro-14', label: 'editor.constants.presets.macbook_pro_14', width: 1512, height: 982, category: 'editor.constants.categories.ui_ux' },
  { id: 'surface-pro', label: 'editor.constants.presets.surface_pro', width: 1440, height: 960, category: 'editor.constants.categories.ui_ux' },
  { id: 'instagram-post', label: 'editor.constants.presets.instagram_post', width: 1080, height: 1350, category: 'editor.constants.categories.social' },
  { id: 'instagram-story', label: 'editor.constants.presets.instagram_story', width: 1080, height: 1920, category: 'editor.constants.categories.social' },
  { id: 'instagram-landscape', label: 'editor.constants.presets.instagram_landscape', width: 1080, height: 566, category: 'editor.constants.categories.social' },
  { id: 'instagram-portrait', label: 'editor.constants.presets.instagram_portrait', width: 1080, height: 1350, category: 'editor.constants.categories.social' },
  { id: 'tiktok-video', label: 'editor.constants.presets.tiktok_video', width: 1080, height: 1920, category: 'editor.constants.categories.social' },
  { id: 'youtube-thumbnail', label: 'editor.constants.presets.youtube_thumbnail', width: 1280, height: 720, category: 'editor.constants.categories.social' },
  { id: 'youtube-channel-art', label: 'editor.constants.presets.youtube_channel_art', width: 2560, height: 1440, category: 'editor.constants.categories.social' },
  { id: 'facebook-post', label: 'editor.constants.presets.facebook_post', width: 1200, height: 630, category: 'editor.constants.categories.social' },
  { id: 'facebook-cover', label: 'editor.constants.presets.facebook_cover', width: 820, height: 312, category: 'editor.constants.categories.social' },
  { id: 'facebook-story', label: 'editor.constants.presets.facebook_story', width: 1080, height: 1920, category: 'editor.constants.categories.social' },
  { id: 'x-post', label: 'editor.constants.presets.x_post', width: 1200, height: 675, category: 'editor.constants.categories.social' },
  { id: 'x-header', label: 'editor.constants.presets.x_header', width: 1500, height: 500, category: 'editor.constants.categories.social' },
  { id: 'linkedin-post', label: 'editor.constants.presets.linkedin_post', width: 1200, height: 627, category: 'editor.constants.categories.social' },
  { id: 'linkedin-cover', label: 'editor.constants.presets.linkedin_cover', width: 1584, height: 396, category: 'editor.constants.categories.social' },
  { id: 'pinterest-pin', label: 'editor.constants.presets.pinterest_pin', width: 1000, height: 1500, category: 'editor.constants.categories.social' },
  { id: 'threads-post', label: 'editor.constants.presets.threads_post', width: 1080, height: 1350, category: 'editor.constants.categories.social' },
  { id: 'dribbble-shot', label: 'editor.constants.presets.dribbble_shot', width: 1600, height: 1200, category: 'editor.constants.categories.social' },
  { id: 'widescreen-16-9', label: 'editor.constants.presets.widescreen_16_9', width: 1920, height: 1080, category: 'editor.constants.categories.presentation' },
  { id: 'standard-4-3', label: 'editor.constants.presets.standard_4_3', width: 1024, height: 768, category: 'editor.constants.categories.presentation' },
  { id: 'widescreen-16-10', label: 'editor.constants.presets.widescreen_16_10', width: 1920, height: 1200, category: 'editor.constants.categories.presentation' },
  { id: 'google-slides', label: 'editor.constants.presets.google_slides', width: 1600, height: 900, category: 'editor.constants.categories.presentation' },
  { id: 'keynote', label: 'editor.constants.presets.keynote', width: 1920, height: 1080, category: 'editor.constants.categories.presentation' },
  { id: 'pitch-deck', label: 'editor.constants.presets.pitch_deck', width: 1920, height: 1080, category: 'editor.constants.categories.presentation' },
  { id: 'web-desktop-hd', label: 'editor.constants.presets.web_desktop_hd', width: 1920, height: 1080, category: 'editor.constants.categories.web' },
  { id: 'web-desktop', label: 'editor.constants.presets.web_desktop', width: 1440, height: 900, category: 'editor.constants.categories.web' },
  { id: 'web-laptop', label: 'editor.constants.presets.web_laptop', width: 1366, height: 768, category: 'editor.constants.categories.web' },
  { id: 'web-small-desktop', label: 'editor.constants.presets.web_small_desktop', width: 1280, height: 800, category: 'editor.constants.categories.web' },
  { id: 'web-full-page', label: 'editor.constants.presets.web_full_page', width: 1440, height: 3000, category: 'editor.constants.categories.web' },
  { id: 'web-landing-page', label: 'editor.constants.presets.web_landing_page', width: 1440, height: 5000, category: 'editor.constants.categories.web' },
  { id: 'web-hero-banner', label: 'editor.constants.presets.web_hero_banner', width: 1920, height: 600, category: 'editor.constants.categories.web' },
  { id: 'web-leaderboard', label: 'editor.constants.presets.web_leaderboard', width: 728, height: 90, category: 'editor.constants.categories.web' },
  { id: 'web-medium-rectangle', label: 'editor.constants.presets.web_medium_rectangle', width: 300, height: 250, category: 'editor.constants.categories.web' },
  { id: 'web-email-header', label: 'editor.constants.presets.web_email_header', width: 600, height: 200, category: 'editor.constants.categories.web' },
  { id: 'web-favicon', label: 'editor.constants.presets.web_favicon', width: 32, height: 32, category: 'editor.constants.categories.web' },
  { id: 'web-og-image', label: 'editor.constants.presets.web_og_image', width: 1200, height: 630, category: 'editor.constants.categories.web' },
  { id: 'video-full-hd', label: 'editor.constants.presets.video_full_hd', width: 1920, height: 1080, category: 'editor.constants.categories.video' },
  { id: 'video-4k', label: 'editor.constants.presets.video_4k', width: 3840, height: 2160, category: 'editor.constants.categories.video' },
  { id: 'video-hd', label: 'editor.constants.presets.video_hd', width: 1280, height: 720, category: 'editor.constants.categories.video' },
  { id: 'video-2k', label: 'editor.constants.presets.video_2k', width: 2560, height: 1440, category: 'editor.constants.categories.video' },
  { id: 'video-vertical', label: 'editor.constants.presets.video_vertical', width: 1080, height: 1920, category: 'editor.constants.categories.video' },
  { id: 'video-square', label: 'editor.constants.presets.video_square', width: 1080, height: 1080, category: 'editor.constants.categories.video' },
  { id: 'video-youtube-thumb', label: 'editor.constants.presets.video_youtube_thumb', width: 1280, height: 720, category: 'editor.constants.categories.video' },
  { id: 'video-youtube-end', label: 'editor.constants.presets.video_youtube_end', width: 1920, height: 1080, category: 'editor.constants.categories.video' },
  { id: 'video-twitch-overlay', label: 'editor.constants.presets.video_twitch_overlay', width: 1920, height: 1080, category: 'editor.constants.categories.video' }
];

export const IMAGE_FILTERS = [
  { id: 'none', label: 'editor.constants.filters.none' },
  { id: 'grayscale', label: 'editor.constants.filters.grayscale' },
  { id: 'warm', label: 'editor.constants.filters.warm' },
  { id: 'cold', label: 'editor.constants.filters.cold' },
  { id: 'pop', label: 'editor.constants.filters.pop' },
  { id: 'contrast', label: 'editor.constants.filters.contrast' },
  { id: 'color', label: 'editor.constants.filters.color' },
  { id: 'cinema', label: 'editor.constants.filters.cinema' }
];

export const GLASS_PRESETS = [
  { id: 'clear', label: 'editor.constants.glass.clear', blur: 10, opacity: 0.1, border: 0.2 },
  { id: 'frosted', label: 'editor.constants.glass.frosted', blur: 20, opacity: 0.2, border: 0.3 },
  { id: 'milky', label: 'editor.constants.glass.milky', blur: 30, opacity: 0.4, border: 0.4 },
  { id: 'smoke', label: 'editor.constants.glass.smoke', blur: 15, opacity: 0.3, border: 0.2, color: 'rgba(0,0,0,0.3)' },
  { id: 'ocean', label: 'editor.constants.glass.ocean', blur: 12, opacity: 0.2, border: 0.3, color: 'rgba(37,99,235,0.1)' }
];

export const GRADIENTS = [
  { id: 'sunset', name: 'editor.constants.gradients.sunset', colors: ['#f83600', '#f9d423'] },
  { id: 'ocean', name: 'editor.constants.gradients.ocean', colors: ['#4facfe', '#00f2fe'] },
  { id: 'forest', name: 'editor.constants.gradients.forest', colors: ['#0ba360', '#3cba92'] },
  { id: 'aurora', name: 'editor.constants.gradients.aurora', colors: ['#6a11cb', '#2575fc'] },
  { id: 'cyberpunk', name: 'editor.constants.gradients.cyberpunk', colors: ['#ff00cc', '#3333ff'] },
  { id: 'gold', name: 'editor.constants.gradients.gold', colors: ['#bf953f', '#fcf6ba', '#b38728', '#fbf5b7', '#aa771c'] }
];
