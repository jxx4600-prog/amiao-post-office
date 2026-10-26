(() => {
 const fonts={cartoon:'MiaoLatin,MiaoRound,sans-serif',happy:'MiaoHappy,MiaoRound,sans-serif',literary:'MiaoLiterary,MiaoRound,serif',longcang:'MiaoLongCang,Hand,serif',kai:'Hand,KaiTi,serif',song:'SimSun,"Songti SC",serif',calligraphy:'STXingkai,"华文行楷",Hand,serif',caveat:'MiaoCaveat,MiaoRound,cursive',pacifico:'MiaoPacifico,MiaoRound,cursive',dancing:'MiaoDancing,MiaoRound,cursive'};
 const groups=[['可爱卡通',[['cartoon','圆圆卡通'],['happy','站酷快乐体']]],['手账文艺',[['literary','站酷小薇体'],['longcang','龙藏手书'],['kai','手写楷体'],['song','经典宋体'],['calligraphy','行书']]],['英文花字',[['caveat','Caveat · 自由手写'],['pacifico','Pacifico · 复古圆润'],['dancing','Dancing Script · 连笔花体']]]];
 function title(l){const style=l.titleStyleProps||{},size=Number(style.fontSize??l.titleSize)||Math.max(28,Math.round((Number(l.fontSize)||19)*1.45));return {...l,...style,fontSize:size,lineHeight:Number(style.lineHeight)||Math.round(size*1.4)};}
 let fontStyles;
 function ensureFonts(){if(fontStyles)return fontStyles;fontStyles=new Promise(resolve=>{const link=document.createElement('link');link.rel='stylesheet';link.href='fonts-editor.css?v=20261026-3';link.onload=()=>resolve();link.onerror=()=>resolve();document.head.append(link);});return fontStyles;}
 window.addEventListener('miao:render',({detail})=>{if(detail.page==='record'||detail.page==='delivery')ensureFonts();});
 window.miaoTypography={fonts,groups,title,ensureFonts};
})();
