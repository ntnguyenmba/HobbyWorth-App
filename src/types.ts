export type LocaleCode='en'|'es'|'vi'|'fr'|'de'|'zh-Hans';
export type Numbers={cost:string;minutes:string;yield:string;price:string};
export type Project={id:string;hobbyId:string;createdAt:string;completedAt?:string;steps:boolean[];numbers:Numbers;split:{materials:string;packaging:string;fees:string};scenarios:string[];photos:string[];coverPhotoIndex?:number;note:string};
export type State={project:Project|null;history:Project[];premium:boolean;locale:LocaleCode;symbol:string};
export type Hobby={id:string;category:string;tags:string[];image:string};
