import * as Path from 'path';
import * as Common from './db_common';
import { Version } from '../schema/schema';

function indexFilesTab(rows) {
    const ret: any = [];
    const WWW = 'http://bib7.umassmed.edu/~purcarom/screen/ver4/v10';
    for (const r of rows) {
        const d = { ...r };
        const accs = [r['dnase'], r['h3k4me3'], r['h3k27ac'], r['ctcf']].filter(a => a !== 'NA');
        const fn = accs.join('_') + '.cREs.bigBed.bed.gz';
        d['fiveGroup'] = [Path.join(WWW, fn), fn];
        ret.push(d);
    }
    return ret;
}



async function load(version: Version) {
    const assembly = version.assembly;
    const chromCounts = await Common.chromCounts(assembly);
    const creHist = await Common.creHist(assembly);
    const tf_list = await Common.tfHistoneDnaseList(assembly, 'encode');
    const datasets = await Common.datasets(assembly);
    const rankMethodToCellTypes = await Common.rankMethodToCellTypes(assembly);
    const rankMethodToIDxToCellType = await Common.rankMethodToIDxToCellType(assembly);
    const { toSymbol, toStrand } = await Common.genemap(assembly);
    const nineState = await Common.loadNineStateGenomeBrowser(assembly);
    const filesList = indexFilesTab(Object.keys(nineState).map(k => nineState[k]));
    const inputData = await Common.inputData(assembly);
    const geBiosampleTypes = await Common.geBiosampleTypes(assembly);
    const geneIDsToApprovedSymbol = await Common.geneIDsToApprovedSymbol(assembly);
    const peak_tfHistCounts = await Common.tfHistCounts(assembly, 'peak');
    const tfHistCounts = {
        peak: peak_tfHistCounts,
        cistrome: {}
    };
    const creBigBeds = await Common.creBigBeds(assembly);
    const ctmap = await Common.makeCtMap(assembly);
    const ctsTable = await Common.makeCTStable(assembly);

    const cache = {
        chromCounts: chromCounts,
        creHist: creHist,

        tf_list: tf_list,

        datasets: datasets,

        rankMethodToCellTypes: rankMethodToCellTypes,
        rankMethodToIDxToCellType: rankMethodToIDxToCellType,
        rankMethodToIDxToCellTypeZeroBased: undefined,

        biosampleTypes: undefined,
        assaymap: undefined,
        ensemblToSymbol: toSymbol,
        ensemblToStrand: toStrand,

        nineState: nineState,
        filesList: filesList,
        inputData: inputData,

        moreTracks: undefined,

        geBiosampleTypes: geBiosampleTypes,

        geneIDsToApprovedSymbol: geneIDsToApprovedSymbol,

        tfHistCounts: tfHistCounts,

        creBigBeds: creBigBeds,

        ctmap: ctmap,
        ctsTable: ctsTable
    };
    return cache;
}

async function loadGlobal(versiontag: string) {
    const colors = require('./colors');
    const helpKeys = await Common.getHelpKeys();
    const hg19cache = cache({versiontag, assembly: 'hg19'});
    const mm10cache = cache({versiontag, assembly: 'mm10'});
    const files = [].concat(hg19cache.filesList).concat(mm10cache.filesList);
    const inputData = [].concat(hg19cache.inputData).concat(mm10cache.inputData);

    const global_cache = {
        colors: colors,
        helpKeys: helpKeys,
        files: files,
        inputData: inputData,
    };
    return global_cache;
}

export interface VersionedAssemblyCache {
    [assembly: string]: any;

}

export interface VersionCache {
    [versiontag: string]: VersionedAssemblyCache;
}

const caches: VersionCache  = { 'v11': {} };
const globalcache: { [versiontag: string]: any } = {};
let loaded = false;
export async function loadCaches() {
    if (loaded) {
        return;
    }
    caches.v11.hg19 = await load({versiontag: 'v11', assembly: 'hg19'});
    caches.v11.mm10 = await load({versiontag: 'v11', assembly: 'mm10'});
    globalcache.v11 = await loadGlobal('v11');
    loaded = true;
    console.log('Cache loaded: ', Object.keys(caches));
}

export function cache(version: Version) {
    if (!(version.versiontag in caches)) {
        throw new Error('Unknown version: ' + version.versiontag);
    }
    if (!(version.assembly in caches[version.versiontag])) {
        throw new Error('Unknown assembly ' + version.assembly + ' in ' + version.versiontag);
    }
    return caches[version.versiontag][version.assembly];
}

const Compartments = [
    'cell', 'nucleoplasm', 'cytosol',
    'nucleus', 'membrane', 'chromatin',
    'nucleolus'];

const chrom_lengths = require('../constants').chrom_lengths;
export function global_data(version: Version) {
    const c = cache(version);
    const datasets = c.datasets;
    return {
        'tfs': c.tf_list,
        'cellCompartments': Compartments,
        'cellTypeInfoArr': datasets.globalCellTypeInfoArr,
        'chromCounts': c.chromCounts,
        'chromLens': chrom_lengths[version.assembly],
        'creHistBins': c.creHist,
        'byCellType': datasets.byCellType,
        'geBiosampleTypes': c.geBiosampleTypes,
        'creBigBedsByCellType': c.creBigBeds,
        'creFiles': c.filesList,
    };
}

export function global_data_global(versiontag: string) {
    return { versiontag, ...globalcache[versiontag] };
}

export function lookupEnsembleGene(version: Version, s) {
    const c = cache(version);
    let symbol = c.ensemblToSymbol[s];
    let strand = c.ensemblToStrand[s];
    if (strand) {
        return { symbol, strand };
    }
    const d = s.split('.')[0];
    symbol = c.ensemblToSymbol[d];
    strand = c.ensemblToStrand[d];
    if (strand) {
        return { symbol, strand };
    }

    if (symbol) {
        return { symbol, strand: '' };
    }
    return { symbol: s, strand: '' };
}

loadCaches().catch(e => {
    console.log(e);
});
