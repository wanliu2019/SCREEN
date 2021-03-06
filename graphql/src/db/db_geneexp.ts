import { db } from './db';

const fixedmap = {
    limb: 'limb',
    'embryonic facial prominence': 'embryonic structure',
    'CH12.LX': 'blood',
    'neural tube': 'neural tube',
    intestine: 'intestine',
    'hematopoietic stem cell': 'blood',
    G1E: 'embryonic stem cell',
    MEP: 'blood',
    'G1E-ER4': 'embryonic stem cell',
    CMP: 'blood',
};

const doLog = d => {
    return parseFloat(Math.log2(parseFloat(d) + 0.01).toFixed(2));
};

const mapRep = (rep: { replicate: number; tpm: number; fpkm: number; id: string }) => ({
    replicate: rep.replicate,
    rawTPM: rep.tpm,
    logTPM: doLog(rep.tpm),
    rawFPKM: rep.fpkm,
    logFPKM: doLog(rep.fpkm),
    rID: rep.id,
});

const makeEntry = row => {
    let tissue = row['organ'].trim();

    if (tissue === '{}') {
        tissue = row['cellType'] in fixedmap ? fixedmap[row['cellType']] : '';
    }

    const reps = row.reps.map(mapRep);
    const avgtpm = reps.map(r => r.rawTPM).reduce((a, b) => a + b) / reps.length;
    const avgfpkm = reps.map(r => r.rawFPKM).reduce((a, b) => a + b) / reps.length;
    reps.push({
        replicate: 'mean',
        rawTPM: avgtpm,
        logTPM: doLog(avgtpm),
        rawFPKM: avgfpkm,
        logFPKM: doLog(avgfpkm),
        rID: reps.map(r => r.rID).join(','),
    });
    return {
        tissue: tissue,
        cellType: row['celltype'],
        expID: row['expid'],
        ageTitle: row['agetitle'],
        reps: reps,
    };
};

export const computeHorBarsAll = async (assembly, gene, compartments, biosample_types) => {
    const tableNameData = assembly + '_rnaseq_expression';
    const tableNameMetadata = assembly + '_rnaseq_metadata';
    const q = `
SELECT
    expid,
    organ,
    cellType,
    ageTitle,
    json_agg(json_build_object('replicate', replicate, 'tpm', tpm, 'fpkm', fpkm, 'id', id)) as reps
FROM (
    SELECT
        r.expid,
        meta.organ,
        meta.cellType,
        meta.ageTitle,
        r.replicate,
        r.id,
        r.tpm,
        r.fpkm
	FROM ${tableNameData} AS r
	INNER JOIN ${tableNameMetadata} AS meta ON meta.expid = r.expid AND meta.replicate = r.replicate
	WHERE gene_name = '${gene}'
    AND meta.cellCompartment = ANY ($1)
    AND meta.biosample_type = ANY ($2)
    GROUP BY
        meta.organ,
        meta.cellType,
        meta.ageTitle,
        r.tpm,
        r.fpkm,
        r.expid,
        r.fileid,
        r.replicate,
        r.id
) g
GROUP BY
    expid,
    organ,
    cellType,
    ageTitle
`;
    const res = await db.any(q, [compartments, biosample_types]);
    return res.map(makeEntry);
};
