import { Client } from 'pg';
import { db } from './db';

export async function select_cre_intersections(assembly: string, acc, key) {
    const tableintersections = assembly + '_fantomcat_' + key;
    const tablegenes = assembly + '_fantomcat_genes';
    const q = `
        SELECT g.*
        FROM ${tablegenes} AS g, ${tableintersections} as i
        WHERE i.geneid = g.geneid AND i.cre = $1
    `;
    return await db.any(q, [acc]);
}

export async function orthologs(assembly: string, accession) {
    const currentspecies = assembly == 'mm10' ? 'mouse' : 'human' ;
    const otherspecies = assembly != 'mm10' ? 'mouse' : 'human';
    const tablename = 'mm10_liftover';
    const q = `
        SELECT chrom, start, stop, ${currentspecies}Accession as accession, overlap
        FROM ${tablename}
        WHERE ${otherspecies}Accession = $1
    `;
    return db.any(q, [accession]);
}
