import * as Common from './db_common';

async function load(assembly) {
    const colors = require('./colors');
    const chromCounts = await Common.chromCounts(assembly);
    const creHist = await Common.creHist(assembly);
    const tf_list = await Common.tfHistoneDnaseList(assembly, 'encode');
    const datasets = await Common.datasets(assembly);
    const rankMethodToIDxToCellType = await Common.rankMethodToIDxToCellType(assembly);
    const { toSymbol, toStrand } = await Common.genemap(assembly);
    const geBiosampleTypes = await Common.geBiosampleTypes(assembly);
    const geneIDsToApprovedSymbol = await Common.geneIDsToApprovedSymbol(assembly);
    const help_keys = await Common.getHelpKeys();
    const creBigBeds = await Common.creBigBeds(assembly);
    const ctmap = await Common.makeCtMap(assembly);
    const ctsTable = await Common.makeCTStable(assembly);

    const cache = {
        colors: colors,

        chromCounts: chromCounts,
        creHist: creHist,

        tf_list: tf_list,

        datasets: datasets,

        rankMethodToCellTypes: undefined,
        rankMethodToIDxToCellType: rankMethodToIDxToCellType,
        rankMethodToIDxToCellTypeZeroBased: undefined,

        biosampleTypes: undefined,
        assaymap: undefined,
        ensemblToSymbol: toSymbol,
        ensemblToStrand: toStrand,

        nineState: undefined,
        filesList: undefined,

        moreTracks: undefined,

        geBiosampleTypes: geBiosampleTypes,

        geneIDsToApprovedSymbol: geneIDsToApprovedSymbol,

        help_keys: help_keys,

        tfHistCounts: undefined,

        creBigBeds: creBigBeds,

        ctmap: ctmap,
        ctsTable: ctsTable
    };
    return cache;
}

let caches = {};
let loaded = false;
async function loadCaches() {
    if (loaded) {
        return;
    }
    const hg19 = await load('hg19');
    const mm10 = await load('mm10');
    const cachesawait = {
        'hg19': hg19,
        'mm10': mm10,
    };
    caches = cachesawait;
    loaded = true;
    console.log('Cache loaded: ', Object.keys(caches));
}

function cache(assembly) {
    return caches[assembly] || {};
}

exports.loadCaches = loadCaches;
exports.cache = cache;


const Compartments = [
    'cell', 'nucleoplasm', 'cytosol',
    'nucleus', 'membrane', 'chromatin',
    'nucleolus'];

const chrom_lengths = require('../constants').chrom_lengths;
function global_data(assembly) {
    const c = cache(assembly);
    const datasets = c.datasets;
    return {
        'tfs': c.tf_list,
        'cellCompartments': Compartments,
        'cellTypeInfoArr': datasets.globalCellTypeInfoArr,
        'chromCounts': c.chromCounts,
        'chromLens': chrom_lengths[assembly],
        'creHistBins': c.creHist,
        'byCellType': datasets.byCellType,
        'geBiosampleTypes': c.geBiosampleTypes,
        'helpKeys': c.help_keys,
        'colors': c.colors,
        'creBigBedsByCellType': c.creBigBeds
    };
}
exports.global_data = global_data;

function lookupEnsembleGene(assembly, s) {
    const c = cache(assembly);
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
        return { symbol, name: '' };
    }
    return { symbol: s, strand: '' };
}
exports.lookupEnsembleGene = lookupEnsembleGene;

loadCaches();
