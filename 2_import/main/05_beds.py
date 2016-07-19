#!/usr/bin/env python

import os, sys, json, psycopg2, argparse, fileinput, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils, printWroteNumLines
from dbs import DBS
from metadataws import MetadataWS
from files_and_paths import Datasets

def setupDB(cur, assembly):
    cur.execute("""
DROP TABLE IF EXISTS bed_ranges_{assembly};
CREATE TABLE bed_ranges_{assembly}
(id serial PRIMARY KEY,
chrom text,
startend int4range,
file_accession text
) """.format(assembly = assembly))

def insertFile(cur, exp, bed):
    fnp = bed.fnp()
    peaks = [r for r in fileinput.input(fnp, mode="r", openhook=fileinput.hook_compressed)]
    outF = StringIO.StringIO()
    for peak in peaks:
        toks = peak.rstrip().split('\t')
        outF.write("\t".join([toks[0],
                              "[%s, %s)" %(toks[1], toks[2]),
                              bed.fileID]) + "\n")
    outF.seek(0)
    cur.copy_from(outF, "bed_ranges_" + bed.assembly, '\t',
                  columns=("chrom", "startend", "file_accession"))
    print "\t", fnp, cur.rowcount

def test(cur):
    # check chr1:134054000-134071000
    cur.execute("""
SELECT DISTINCT expID
FROM bed_ranges_mm10
WHERE chrom = 'chr1'
AND startend && int4range(134054000, 134071000)
""")
    print cur.fetchall()

def build(args, assembly, conn, cur):
    setupDB(cur, assembly)

    if "mm10" == assembly:
        m = MetadataWS(Datasets.all_mouse)
    else:
        m = MetadataWS(Datasets.all_human)

    for exps in [m.chipseq_tfs_useful(args),
                 m.chipseq_histones_useful(args),
                 m.dnases_useful(args)]:
        for exp in exps:
            try:
                beds = exp.bedFilters()
                if not beds:
                    print "missing", exp
                for bed in beds:
                    if not assembly == bed.assembly:
                        continue
                    insertFile(cur, exp, bed)
            except Exception, e:
                print str(e)
                print "bad exp:", exp
        conn.commit()

def index(assembly, cur):
    print "indexing", assembly
    cur.execute("""
    CREATE INDEX chromIdx{assembly} ON bed_ranges_{assembly}(chrom);
    """.format(assembly = assembly))

    print "indexing", assembly, "startend"
    cur.execute("""
    CREATE INDEX rangeIdx{assembly} ON bed_ranges_{assembly} USING gist (startend);
    """.format(assembly = assembly))

def counts(cur, assembly):
    cur.execute("""
select count(1)
from bed_ranges_{assembly}
""".format(assembly = assembly))
    print(assembly, cur.fetchone())

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--process', action="store_true", default=True)
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--rebuild', action="store_true", default=False)
    parser.add_argument('--index', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    if args.local:
        dbs = DBS.localRegElmViz()
    else:
        dbs = DBS.pgdsn("RegElmViz")
    dbs["application_name"] = os.path.basename(__file__)

    with psycopg2.connect(**dbs) as conn:
        with conn.cursor() as cur:
            for assembly in ["hg19", "mm10"]:
                if args.rebuild:
                    build(args, assembly, conn, cur)
                if args.index:
                    index(assembly, cur)

if __name__ == '__main__':
    main()
