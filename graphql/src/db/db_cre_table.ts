import { Client } from 'pg';
import { checkChrom, isaccession, isclose } from '../utils';
import { db } from './db';

const { UserError } = require('graphql-errors');

const accessions = (wheres, params, j: {accessions?: string[]}) => {
    const accs: Array<string> = j['accessions'] || [];
    if (0 == accs.length) {
        return false;
    }
    params.accsList = accs.filter(isaccession).map(a => a.toUpperCase());
    const accsQuery = 'accession = ANY (${accsList})';
    wheres.push(`(${accsQuery})`);
    return true;
};

const notCtSpecific = (wheres, fields, params, j) => {
    // use max zscores
    const allmap = {
        'dnase': 'dnase_max',
        'promoter': 'h3k4me3_max',
        'enhancer': 'h3k27ac_max',
        'ctcf': 'ctcf_max'
    };
    for (const x of ['dnase', 'promoter', 'enhancer', 'ctcf']) {
        if (`rank_${x}_start` in j && `rank_${x}_end` in j) {
            const statement = [
                `cre.${allmap[x]} >= $<rank_${x}_start>`,
                `cre.${allmap[x]} <= $<rank_${x}_end>`].join(' and ');
            params[`rank_${x}_start`] = j[`rank_${x}_start`];
            params[`rank_${x}_end`] = j[`rank_${x}_end`];
            wheres.push(`(${statement})`);
        }
        fields.push(`cre.${allmap[x]} AS ${x}_zscore`);
    }
    return { wheres, fields };
};

const ctSpecific = (wheres, fields, params, ctSpecificObj, ct, j, ctmap) => {
    ctSpecificObj['ct'] = "'" + ct + "'";
    const exps = [['dnase', 'dnase'],
    ['promoter', 'h3k4me3'],
    ['enhancer', 'h3k27ac'],
    ['ctcf', 'ctcf']];
    for (const v of exps) {
        const [name, exp] = v;
        if (!(ct in ctmap[name])) {
            continue;
        }
        const ctindex = ctmap[name][ct];
        fields.push(`cre.${exp}_zscores[${ctindex}] AS ${name}_zscore`);
        ctSpecificObj[name + '_zscore'] = `cre.${exp}_zscores[${ctindex}]`;

        if (`rank_${name}_start` in j && `rank_${name}_end` in j) {
            const start = j[`rank_${name}_start`];
            const end = j[`rank_${name}_end`];
            const minDefault = -10.0; // must match slider default
            const maxDefault = 10.0;  // must match slider default
            let startWhere;
            let endWhere;
            if (!isclose(start, minDefault)) {
                startWhere = `cre.${exp}_zscores[${ctindex}] >= $<${exp}_zscores_${ctindex}_start>`;
                params[`${exp}_zscores_${ctindex}_start`] = start;
            }
            if (!isclose(end, maxDefault)) {
                endWhere = `cre.${exp}_zscores[${ctindex}] <= $<${exp}_zscores_${ctindex}_end>`;
                params[`${exp}_zscores_${ctindex}_end`] = end;
            }
            if (startWhere && endWhere) {
                wheres.push(`(${startWhere} and ${endWhere}`);
            } else if (startWhere) {
                wheres.push(`(${startWhere})`);
            } else if (endWhere) {
                wheres.push(`(${endWhere})`);
            }
        }
    }
};

const where = (wheres, params, chrom, start, stop) => {
    if (chrom) {
        wheres.push(`cre.chrom = $<chrom>`);
        params.chrom = chrom;
    }
    if (start && stop) {
        wheres.push(`int4range(cre.start, cre.stop) && int4range($<start>, $<stop>)`);
        params.start = start;
        params.stop = stop;
    }
};

const buildWhereStatement = (ctmap, j: object, chrom: string | null, start: string | null, stop: string | null) => {
    const wheres = [];
    const fields = [
        'maxZ',
        'cre.chrom',
        'cre.start',
        'cre.stop',
        'cre.gene_all_id',
        'cre.gene_pc_id'
    ];
    const params: any = {};
    const useAccs = accessions(wheres, params, j);
    const ct = j['cellType'];

    const ctspecificobj = {};
    if (useAccs || !ct) {
        notCtSpecific(wheres, fields, params, j);
    } else {
        ctSpecific(wheres, fields, params, ctspecificobj, ct, j, ctmap);
    }
    where(wheres, params, chrom, start, stop);

    const ctspecificpairs: Array<string> = [];
    for (const k of Object.keys(ctspecificobj)) {
        ctspecificpairs.push(`'${k}', ${ctspecificobj[k]}`);
    }
    const ctspecificfield = 'json_build_object(' + ctspecificpairs.join(',') + ') as ctspecific';

    const infoFields = {
        'accession': 'cre.accession',
        'isproximal': 'cre.isproximal',
        'k4me3max': 'cre.h3k4me3_max',
        'k27acmax': 'cre.h3k27ac_max',
        'ctcfmax': 'cre.ctcf_max',
        'concordant': 'cre.concordant'
    };

    const infopairs: Array<string> = [];
    for (const k of Object.keys(infoFields)) {
        infopairs.push(`'${k}', ${infoFields[k]}`);
    }
    const infofield = 'json_build_object(' + infopairs.join(',') + ') as info';

    const retfields = [infofield, ctspecificfield, ...fields].join(', ');
    let retwhere = '';
    if (0 < wheres.length) {
        retwhere = 'WHERE ' + wheres.join(' and ');
    }
    return { fields: retfields, where: retwhere, params };
};


async function creTableEstimate(table, where, params) {
    // estimate count
    // from https://wiki.postgresql.org/wiki/Count_estimate
    const q = `
        SELECT count(0)
        FROM ${table} AS cre
        ${where}
        LIMIT 1
    `;

    return db.one(q, params, r => +(r.count));
}

export async function getCreTable(assembly: string, ctmap: object, j, pagination) {
    const chrom = j.range && checkChrom(assembly, j.range.chrom);
    const start = j.range && j.range.start;
    const end = j.range && j.range.end;
    const table = assembly + '_cre_all';
    const { fields, where, params } = buildWhereStatement(ctmap, j, chrom, start, end);
    const offset = pagination.offset || 0;
    const limit = pagination.limit || 1000;
    if (limit > 1000) {
        throw new UserError('Cannot have a limit greater than 1000 in pagination parameters.');
    }
    if (offset + limit > 10000) {
        throw new UserError('Offset + limit cannot be greater than 10000. Refine your search for more data.');
    }
    const query = `
        SELECT ${fields}
        FROM ${table} AS cre
        ${where}
        ORDER BY maxz DESC
        ${offset !== 0 ? `OFFSET ${offset}` : ''}
        LIMIT ${limit}
    `;

    const res = await db.any(query, params);
    let total = res.length;
    if (limit <= total || offset !== 0) {// reached query limit
        total = await creTableEstimate(table, where, params);
    }
    return {'cres': res, 'total': total};
}

export async function rfacets_active(ctmap, j) {
    const present: Array<string> = [];
    const ct = j['cellType'];
    if (!ct) {
        return present;
    }
    for (const assay of ['dnase', 'promoter', 'enhancer', 'ctcf']) {
        if (ct in ctmap[assay]) {
            present.push(assay);
        }
    }
    return present;
}
