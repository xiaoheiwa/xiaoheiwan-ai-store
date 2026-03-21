// 统一的前卫排版样式 - 用于编辑器和内容展示
// 确保所见即所得

// 基础排版
const baseStyles = "text-foreground leading-[1.8] text-[15px] sm:text-base"

// 标题样式
const headingStyles = [
  "[&_h1]:text-[1.75rem] [&_h1]:sm:text-[2rem] [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:leading-[1.3] [&_h1]:pb-2 [&_h1]:border-b-2 [&_h1]:border-accent/30",
  "[&_h2]:text-[1.375rem] [&_h2]:sm:text-[1.5rem] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:leading-[1.35] [&_h2]:pl-3 [&_h2]:border-l-[3px] [&_h2]:border-accent",
  "[&_h3]:text-[1.125rem] [&_h3]:sm:text-[1.25rem] [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:leading-[1.4]",
  "[&_h4]:text-[1rem] [&_h4]:sm:text-[1.125rem] [&_h4]:font-medium [&_h4]:text-foreground [&_h4]:mt-5 [&_h4]:mb-2",
].join(" ")

// 段落
const paragraphStyles = "[&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:leading-[1.85] [&_p:empty]:hidden"

// 链接
const linkStyles = "[&_a]:text-accent [&_a]:font-medium [&_a]:no-underline [&_a]:border-b [&_a]:border-accent/30 [&_a]:pb-[1px] [&_a]:transition-all [&_a]:duration-200 [&_a:hover]:border-accent [&_a:hover]:text-accent/80"

// 文本格式
const textStyles = "[&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic [&_em]:text-muted-foreground/90 [&_u]:underline [&_u]:decoration-2 [&_u]:underline-offset-4 [&_u]:decoration-accent/50 [&_s]:line-through [&_s]:opacity-60 [&_sup]:text-[0.75em] [&_sup]:align-super [&_sub]:text-[0.75em] [&_sub]:align-sub"

// 列表
const listStyles = "[&_ul]:my-4 [&_ul]:pl-6 [&_ul]:list-disc [&_ul]:space-y-1 [&_ol]:my-4 [&_ol]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-1 [&_li]:text-muted-foreground [&_li]:leading-[1.75] [&_li_p]:mb-0"

// 引用块
const blockquoteStyles = "[&_blockquote]:my-5 [&_blockquote]:py-3 [&_blockquote]:px-4 [&_blockquote]:rounded-lg [&_blockquote]:bg-muted/40 [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_blockquote]:leading-[1.7] [&_blockquote_p]:mb-0 [&_blockquote_p]:text-muted-foreground"

// 代码
const codeStyles = "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:text-accent [&_code]:border [&_code]:border-border/50 [&_pre]:my-5 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:bg-[#1a1b26] [&_pre]:dark:bg-muted [&_pre]:overflow-x-auto [&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:border [&_pre]:border-border/30 [&_pre_code]:bg-transparent [&_pre_code]:border-none [&_pre_code]:p-0 [&_pre_code]:text-[#a9b1d6] [&_pre_code]:dark:text-foreground"

// 分隔线
const hrStyles = "[&_hr]:my-8 [&_hr]:border-none [&_hr]:h-px [&_hr]:bg-gradient-to-r [&_hr]:from-transparent [&_hr]:via-border [&_hr]:to-transparent"

// 图片
const imgStyles = "[&_img]:my-5 [&_img]:mx-auto [&_img]:block [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:shadow-md [&_img]:cursor-pointer [&_img]:transition-all [&_img]:duration-300 [&_img:hover]:shadow-lg [&_img:hover]:scale-[1.01] [&_figure]:my-6 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground/70 [&_figcaption]:mt-2 [&_figcaption]:italic"

// 表格
const tableStyles = "[&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_table]:rounded-xl [&_table]:overflow-hidden [&_th]:bg-muted/60 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:border-b [&_th]:border-border [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-border/50 [&_td]:text-muted-foreground [&_tr:last-child_td]:border-b-0 [&_tr:hover]:bg-muted/30"

// 高亮和对齐
const miscStyles = "[&_mark]:bg-yellow-200/70 [&_mark]:dark:bg-yellow-500/30 [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:rounded [&_[style*='text-align:_center']]:text-center [&_[style*='text-align:_right']]:text-right [&_[style*='text-align:_justify']]:text-justify [&_.text-center]:text-center [&_.text-right]:text-right [&_.text-justify]:text-justify [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"

export const contentStyles = [
  baseStyles,
  headingStyles,
  paragraphStyles,
  linkStyles,
  textStyles,
  listStyles,
  blockquoteStyles,
  codeStyles,
  hrStyles,
  imgStyles,
  tableStyles,
  miscStyles,
].join(" ")

// 编辑器专用样式（保持兼容性）
export const editorStyles = contentStyles
