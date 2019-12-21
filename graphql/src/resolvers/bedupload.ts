import * as util from 'util';
import * as fs from 'fs';
import { loadCache } from '../db/db_cache';
import { getCreTable } from '../db/db_cre_table';
import { Assembly } from '../types';

const uuidv4 = require('uuid/v4');

const exec = util.promisify(require('child_process').exec);
const config = require('../config.json');
// "/home/purcarom/intersect/incoming"
const incomingDir = config.bedupload.incomingDir;
// "/home/purcarom/intersect/hg19.sorted.bed"
const hg19bed = config.bedupload.hg19bed;
// "/home/purcarom/intersect/mm10.sorted.bed"
const mm10bed = config.bedupload.mm10bed;

async function intersect(uuid: string, assembly: string, lines: [string]) {
    const tempfile = incomingDir + '/' + uuid;
    const stream = fs.createWriteStream(tempfile);

    for (let line of lines) {
        line = line.trim();
        stream.write(line + '\n');
    }
    stream.end();

    const cres = {
        hg19: hg19bed,
        mm10: mm10bed,
    };

    const cmds = [
        'cat',
        tempfile,
        '|',
        'sort -k1,1 -k2,2n',
        '|',
        'bedtools intersect -a ',
        cres[assembly],
        ' -b stdin',
        '|',
        'sort | uniq',
        '|',
        'head -n 1000',
        '|',
        "awk '{ print $5 }'",
    ];

    const { stdout, stderr } = await exec(cmds.join(' '));
    if (stderr) {
        throw new Error(stderr);
    }
    fs.unlink(tempfile, () => {});
    const accessions = stdout
        .trim()
        .split('\n')
        .map(a => a.trim());
    return accessions;
}

export async function resolve_bedupload(source, args, context, info) {
    const uuid: string = args.uuid;
    const assembly: Assembly = args.assembly;
    const lines: [string] = args.lines;
    const accessions = await intersect(uuid, assembly, lines);
    const ctmap = await loadCache(assembly).ctmap();
    const results = await getCreTable(assembly, ctmap, { accessions }, {});
    return { bedname: args.bedname || uuidv4(), assembly, ccREs: results.cres };
}