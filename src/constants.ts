export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'bento-box-design',
    title: 'Bento Box Design: o estilo que conquistou o mundo do design',
    category: 'Tendências',
    date: '01 Jan 2025',
    readTime: '8 min',
    excerpt: 'Entenda o que é o Bento Box Design, como surgiu, por que a Apple popularizou e como aplicar essa tendência nos seus projetos.',
    image: 'https://picsum.photos/seed/bento/800/600',
    content: `
Se você acompanha o universo do design gráfico e de interfaces digitais, certamente já se deparou com aquele layout organizado em blocos retangulares de tamanhos variados, cada um carregando uma informação visual de forma limpa e direta. Esse é o **Bento Box Design**. uma das tendências mais marcantes dos últimos anos e que segue forte em 2025.

O nome vem diretamente da cultura japonesa. O *bento* (弁当) é a tradicional lunchbox japonesa, uma caixa dividida em compartimentos de diferentes tamanhos, cada um com um alimento diferente, organizados de forma harmônica, prática e visualmente agradável. A analogia com o design é perfeita: blocos de conteúdo que se encaixam como peças de um quebra-cabeça, cada um com sua função, juntos formando um todo coeso e elegante.

## De onde surgiu o Bento Box Design?

A influência do design japonês na estética moderna não é novidade. O Japão sempre foi referência em simplicidade funcional. do minimalismo arquitetônico ao design de embalagens, passando pelo conceito de *wabi-sabi* (a beleza da imperfeição) e do *ma* (o valor do espaço vazio). O Bento Box Design absorve essa filosofia e a traduz para o ambiente digital e gráfico contemporâneo.

Do ponto de vista técnico, o estilo tem raízes no **CSS Grid Layout**, que se popularizou entre os desenvolvedores e designers a partir de 2017-2018. Com ele, tornou-se trivial criar layouts em grade com células de tamanhos diferentes, algo que antes exigia gambiarras com floats ou frameworks pesados.

Mas foi em **setembro de 2023** que o Bento Box Design ganhou verdadeiramente o mainstream: a Apple usou exatamente esse estilo em sua keynote do iPhone 15. A apresentação de features do produto foi feita em slides compostos por blocos retangulares organizados em grade. alguns menores, outros maiores, cada um destacando uma funcionalidade de forma visual e direta. O impacto foi imediato. No dia seguinte, designers do mundo inteiro estavam reproduzindo e estudando aquele layout.
    `
  },
  {
    id: '2',
    slug: 'apple-liquid-glass',
    title: 'Apple Liquid Glass: a nova linguagem visual que vai redefinir o design',
    category: 'UI/UX',
    date: '01 Jan 2025',
    readTime: '9 min',
    excerpt: 'Entenda o que é o Liquid Glass, a nova linguagem visual da Apple apresentada no WWDC 2025, e como essa tendência vai impactar o design.',
    image: 'https://picsum.photos/seed/glass/800/600',
    content: `
A Apple raramente muda sua linguagem visual de forma radical. Desde o iOS 7. lançado em 2013, quando Jony Ive conduziu a transição do skeuomorfismo para o flat design. a empresa ajustou, refinou e evoluiu seu design system de forma incremental. Por isso, quando a Apple apresentou o **Liquid Glass** no WWDC 2025, o impacto foi enorme. Não era uma atualização. Era uma redefinição.

O Liquid Glass é a nova linguagem visual da Apple, introduzida simultaneamente no iOS 26, iPadOS 26, macOS Tahoe e watchOS 26. Ela representa a maior transformação visual da plataforma Apple em mais de uma década. e, como toda grande mudança que a Apple promove, vai influenciar profundamente o design de interfaces digitais nos próximos anos.

## O que é o Liquid Glass?

O nome é literal e metafórico ao mesmo tempo. Liquid Glass é um material de interface que simula as propriedades ópticas do vidro líquido: **transparência dinâmica, refração de luz, reflexos e distorções que reagem ao conteúdo por baixo**.
    `
  },
  {
    id: '3',
    slug: 'ia-no-design-grafico',
    title: 'Como a inteligência artificial pode transformar o dia a dia do designer',
    category: 'IA no Design',
    date: '01 Jan 2025',
    readTime: '10 min',
    excerpt: 'Guia completo e prático sobre como usar inteligência artificial para acelerar seu trabalho como designer gráfico.',
    image: 'https://picsum.photos/seed/ai/800/600',
    content: `
Existe muito ruído em torno da inteligência artificial e do design. De um lado, manchetes alarmistas prevendo o fim da profissão. Do outro, entusiastas afirmando que a IA vai fazer tudo sozinha. A realidade, como sempre, é mais interessante e mais nuançada do que qualquer um dos extremos.

A verdade é esta: **a IA não vai substituir designers. Mas designers que usam IA vão substituir designers que não usam.** Essa frase, atribuída a diferentes pessoas nos últimos dois anos, captura com precisão o momento que estamos vivendo.

Este artigo não é sobre especulação ou teoria. É um guia prático sobre como você, designer gráfico brasileiro, pode começar a usar IA hoje para trabalhar melhor, mais rápido e com mais criatividade.
    `
  }
];
