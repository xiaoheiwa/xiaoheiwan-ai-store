// 统一的前卫排版样式 - 用于编辑器和内容展示
// 确保所见即所得

export const contentStyles = `
  /* 基础排版 */
  text-foreground leading-[1.8] text-[15px] sm:text-base
  
  /* 标题样式 - 现代感、大气 */
  [&_h1]:text-[1.75rem] [&_h1]:sm:text-[2rem] [&_h1]:font-bold [&_h1]:tracking-tight
  [&_h1]:text-foreground [&_h1]:mt-10 [&_h1]:mb-5 [&_h1]:leading-[1.3]
  [&_h1]:relative [&_h1]:pb-3
  [&_h1]:after:content-[''] [&_h1]:after:absolute [&_h1]:after:bottom-0 [&_h1]:after:left-0
  [&_h1]:after:w-12 [&_h1]:after:h-1 [&_h1]:after:bg-gradient-to-r [&_h1]:after:from-accent [&_h1]:after:to-transparent
  [&_h1]:after:rounded-full
  
  [&_h2]:text-[1.375rem] [&_h2]:sm:text-[1.5rem] [&_h2]:font-semibold [&_h2]:tracking-tight
  [&_h2]:text-foreground [&_h2]:mt-9 [&_h2]:mb-4 [&_h2]:leading-[1.35]
  [&_h2]:pl-4 [&_h2]:border-l-[3px] [&_h2]:border-accent
  
  [&_h3]:text-[1.125rem] [&_h3]:sm:text-[1.25rem] [&_h3]:font-semibold
  [&_h3]:text-foreground [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:leading-[1.4]
  
  [&_h4]:text-[1rem] [&_h4]:sm:text-[1.125rem] [&_h4]:font-medium
  [&_h4]:text-foreground [&_h4]:mt-6 [&_h4]:mb-2
  
  /* 段落 - 舒适的阅读体验 */
  [&_p]:text-muted-foreground [&_p]:mb-5 [&_p]:leading-[1.85]
  [&_p:empty]:hidden
  
  /* 链接 - 优雅的交互 */
  [&_a]:text-accent [&_a]:font-medium [&_a]:no-underline
  [&_a]:border-b [&_a]:border-accent/30 [&_a]:pb-[1px]
  [&_a]:transition-all [&_a]:duration-200
  [&_a:hover]:border-accent [&_a:hover]:text-accent/80
  
  /* 粗体和斜体 */
  [&_strong]:font-semibold [&_strong]:text-foreground
  [&_em]:italic [&_em]:text-muted-foreground/90
  
  /* 下划线和删除线 */
  [&_u]:underline [&_u]:decoration-2 [&_u]:underline-offset-4 [&_u]:decoration-accent/50
  [&_s]:line-through [&_s]:opacity-60
  
  /* 上下标 */
  [&_sup]:text-[0.75em] [&_sup]:align-super
  [&_sub]:text-[0.75em] [&_sub]:align-sub
  
  /* 列表 - 清晰的层次 */
  [&_ul]:my-5 [&_ul]:pl-0 [&_ul]:list-none [&_ul]:space-y-2
  [&_ol]:my-5 [&_ol]:pl-0 [&_ol]:list-none [&_ol]:space-y-2 [&_ol]:counter-reset-[item]
  
  [&_ul>li]:relative [&_ul>li]:pl-6 [&_ul>li]:text-muted-foreground [&_ul>li]:leading-[1.75]
  [&_ul>li]:before:content-[''] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.6em]
  [&_ul>li]:before:w-[6px] [&_ul>li]:before:h-[6px] [&_ul>li]:before:rounded-full
  [&_ul>li]:before:bg-accent/60
  
  [&_ol>li]:relative [&_ol>li]:pl-8 [&_ol>li]:text-muted-foreground [&_ol>li]:leading-[1.75]
  [&_ol>li]:counter-increment-[item]
  [&_ol>li]:before:content-[counter(item)] [&_ol>li]:before:absolute [&_ol>li]:before:left-0
  [&_ol>li]:before:w-6 [&_ol>li]:before:h-6 [&_ol>li]:before:flex [&_ol>li]:before:items-center [&_ol>li]:before:justify-center
  [&_ol>li]:before:text-xs [&_ol>li]:before:font-semibold [&_ol>li]:before:text-accent
  [&_ol>li]:before:bg-accent/10 [&_ol>li]:before:rounded-full
  
  /* 引用块 - 突出显示 */
  [&_blockquote]:my-6 [&_blockquote]:py-4 [&_blockquote]:px-5 [&_blockquote]:rounded-lg
  [&_blockquote]:bg-muted/40 [&_blockquote]:border-l-4 [&_blockquote]:border-accent
  [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_blockquote]:leading-[1.7]
  [&_blockquote_p]:mb-0 [&_blockquote_p]:text-muted-foreground
  
  /* 代码 */
  [&_code]:bg-muted [&_code]:px-2 [&_code]:py-1 [&_code]:rounded-md
  [&_code]:text-sm [&_code]:font-mono [&_code]:text-accent
  [&_code]:border [&_code]:border-border/50
  
  [&_pre]:my-6 [&_pre]:p-5 [&_pre]:rounded-xl
  [&_pre]:bg-[#1a1b26] [&_pre]:dark:bg-muted
  [&_pre]:overflow-x-auto [&_pre]:text-sm [&_pre]:leading-relaxed
  [&_pre]:border [&_pre]:border-border/30
  [&_pre_code]:bg-transparent [&_pre_code]:border-none [&_pre_code]:p-0
  [&_pre_code]:text-[#a9b1d6] [&_pre_code]:dark:text-foreground
  
  /* 分隔线 */
  [&_hr]:my-10 [&_hr]:border-none [&_hr]:h-px
  [&_hr]:bg-gradient-to-r [&_hr]:from-transparent [&_hr]:via-border [&_hr]:to-transparent
  
  /* 图片 - 现代感展示 */
  [&_img]:my-6 [&_img]:mx-auto [&_img]:block [&_img]:max-w-full [&_img]:h-auto
  [&_img]:rounded-xl [&_img]:shadow-lg
  [&_img]:cursor-pointer [&_img]:transition-all [&_img]:duration-300
  [&_img:hover]:shadow-xl [&_img:hover]:scale-[1.01]
  
  [&_figure]:my-8
  [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground/70
  [&_figcaption]:mt-3 [&_figcaption]:italic
  
  /* 表格 */
  [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
  [&_table]:rounded-xl [&_table]:overflow-hidden
  [&_th]:bg-muted/60 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold
  [&_th]:text-foreground [&_th]:border-b [&_th]:border-border
  [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-border/50 [&_td]:text-muted-foreground
  [&_tr:last-child_td]:border-b-0
  [&_tr:hover]:bg-muted/30
  
  /* 高亮标记 */
  [&_mark]:bg-yellow-200/70 [&_mark]:dark:bg-yellow-500/30
  [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:rounded
  
  /* 文本对齐 */
  [&_[style*='text-align:_center']]:text-center
  [&_[style*='text-align:_right']]:text-right
  [&_[style*='text-align:_justify']]:text-justify
  [&_.text-center]:text-center [&_.text-right]:text-right [&_.text-justify]:text-justify
  
  /* 首个和最后元素边距 */
  [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
`

// 编辑器专用样式（在基础样式上添加）
export const editorStyles = `
  ${contentStyles}
  focus:outline-none min-h-[300px] p-4
  
  /* 占位符样式 */
  [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
  [&_p.is-editor-empty:first-child::before]:text-muted-foreground/50
  [&_p.is-editor-empty:first-child::before]:pointer-events-none
  [&_p.is-editor-empty:first-child::before]:float-left
  [&_p.is-editor-empty:first-child::before]:h-0
`
