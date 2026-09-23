export const site = {
name: "MengYao Blog",
title: "MengYao Blog | Anime × Code",
description: "一个喜欢折腾代码和二次元的个人博客",
author: "MengYao",
keywords: [
"MengYao",
"MengYao Blog",
"个人博客",
"二次元",
"技术开发",
"动漫",
"生活",
"Astro",
],
nav: [
{
href: "/",
label: "HOME",
icon: "tabler:home-heart",
hint: "front page",
},
{
href: "/blog/",
label: "BLOG",
icon: "tabler:book-2",
hint: "notes",
},
{
href: "/games/",
label: "GAME",
icon: "tabler:device-gamepad-2",
hint: "playroom",
},
{
href: "/projects/",
label: "WORKS",
icon: "tabler:code",
hint: "projects",
},
{
href: "/about/",
label: "ME",
icon: "tabler:user-heart",
hint: "profile",
},
],
};

export const categoryLabel: Record<string, string> = {
tech: "技术",
anime: "动漫",
life: "生活",
};
