// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import catppuccin from "@catppuccin/starlight";

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: '@kristall/http',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Jared-MB/http-nextjs' }],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{
							label: 'Installation',
							slug: 'getting-started/installation',
						}
					]
				},
				{
					label: 'API Reference',
					autogenerate: { directory: 'api-reference' },
				},
			],
			plugins: [catppuccin({
				dark: { flavor: "mocha", accent: "mauve" },
				light: { flavor: "latte", accent: "mauve" },
			}),]
		}),
	],
});
