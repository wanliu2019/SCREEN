import { global_data_global } from './db/db_cache';

export default class TissueColors {
    static tissueColors;
    static pad = (n) => ('00' + n).substr(-2);
    static rand = () => Math.floor(Math.random() * 256);
    static randColorGen = () => TissueColors.pad(TissueColors.rand().toString(16));
    static randColor = () => `#${TissueColors.randColorGen()}${TissueColors.randColorGen()}${TissueColors.randColorGen()}`;

    static getTissueColor(tissue: string, versiontag: string) {
        const tissueToColor = global_data_global(versiontag).colors['tissues'];
        if (!(tissue in tissueToColor)) {
            console.log('missing tissue color for', tissue);
            return TissueColors.randColor();
        }
        const c = tissueToColor[tissue];
        if (!c.startsWith('#')) {
            return '#' + c;
        }
        return c;
    }
}
