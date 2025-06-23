export * from './projects'
export * from './education'
export * from './career'

// personal info
export const name = 'Jianwei Ni'
export const headline = 'Computer Science & Statistics @ UIUC'
export const introduction =
  "I'm passionate about building impactful experiences with cutting-edge tech. Currently exploring Mixed Reality (MR) and Generative AI to create intuitive, user-centered products. I enjoy solving hard problems with a detail-oriented mindset and a clear sense of priority."
export const email = 'nijianweijerry@gmail.com'
export const githubUsername = 'JerryNee'

// about page
export const aboutMeHeadline = 'Who Are You and Why Should I Care?'
export const aboutParagraphs = [
  "I'm passionate about building impactful experiences with cutting-edge tech.", 
  "Currently exploring Mixed Reality (MR) and Generative AI to create intuitive, user-centered products.",
  "I enjoy solving hard problems with a detail-oriented mindset and a clear sense of priority.",
]

// publications
export const publications = [
  {
    authors: 'Wang, D., Ni, J., Zhou, Y., Ding, W., Song, W., Yao, M., Cao, C.',
    year: 2025,
    title: 'Object-Tracking-Based Medical Simulation with AI and Mixed-Reality: A Use Case for Procedural Skills Training',
    venue: 'UIST 2025, In Progress'
  },
  {
    authors: 'Wan,D., Song, W., Ni, J., Zheng, Q., Freeman, G.',
    year: 2025,
    title: '"Is My Dog Too Polite To Me?": Designing for Innovating Virtual Companionship Through Large Language Model-Powered Mixed Reality Virtual Pets',
    venue: 'DIS 2025, In Progress'
  },
]

export const publicationHeadLine = "Publications"
export const publicationIntro = "Selected academic conference presentations and peer-reviewed papers."


// social links
export type SocialLinkType = {
  name: string
  ariaLabel?: string
  icon: string
  href: string
}

export const socialLinks: Array<SocialLinkType> = [
  {
    name: 'Linkedin',
    icon: 'linkedin',
    href: 'https://www.linkedin.com/in/jianwei-ni-984134139/',
  },
]

// https://simpleicons.org/
export const techIcons = [
  'javascript',
  'java',
  'mysql',
  'nodedotjs',
  'nextdotjs',
  'nginx',
  'vercel',
  'docker',
  'git',
  'github',
  'visualstudiocode',
  'androidstudio',
  'ios',
  'apple',
  'wechat',
  'openai',
  'google',
  'googlecloud',
  'xcode',
  'leetcode',
  'postman',
  'python',
  'blender',
  'nvidia',
  'republicofgamers',
  'r',
  'unrealengine',
  'unity',
]
