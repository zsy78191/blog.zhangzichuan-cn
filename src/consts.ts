export const SITE = {
  title: '张超的博客',
  description: '技术笔记、工程实践与偶尔的杂谈',
  author: 'zhangchao',
  url: 'https://blog.zhangzichuan.cn',
  locale: 'zh-CN',
} as const;

export const NAV: ReadonlyArray<{ title: string; href: string }> = [
  { title: '首页', href: '/' },
  { title: '归档', href: '/archive' },
  { title: '标签', href: '/tags' },
  { title: '分类', href: '/categories' },
  { title: '关于', href: '/about' },
  { title: '搜索', href: '/search' },
];

export const ICP = {
  text: '苏ICP备18064390号-8',
  link: 'https://beian.miit.gov.cn/',
} as const;

export const SOCIAL: ReadonlyArray<{ name: string; href: string }> = [
  { name: 'GitHub', href: 'https://github.com/zhangchao' },
  { name: 'RSS', href: '/rss.xml' },
];
