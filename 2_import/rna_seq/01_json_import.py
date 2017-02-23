#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, printt

def setupAndCopy(cur, assembly, fnp):
    tableName = "r_expression_" + assembly

    printt("dropping and creating", tableName)
    cur.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName} (
ensembl_id VARCHAR(256) NOT NULL,
gene_name VARCHAR(256) NOT NULL,
dataset VARCHAR(256) NOT NULL,
replicate INT NOT NULL,
fpkm NUMERIC NOT NULL,
tpm NUMERIC NOT NULL);
    """.format(tableName = tableName))

    printt("importing", fnp)
    with gzip.open(fnp) as f:
        cur.copy_from(f, tableName, ',',
                      columns=("ensembl_id", "gene_name", "dataset", "replicate", "fpkm", "tpm"))

def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    d = "/project/umw_zhiping_weng/0_metadata/roderic/public_docs.crg.es/rguigo/encode/expressionMatrices/"
    fnps = {}
    fnps["hg19"] = os.path.join(d, "H.sapiens/hg19/2016_10/gene.human.V19.hg19.RNAseq.2016_10_08.json.gz")
    fnps["mm10"] = os.path.join(d, "M.musculus/mm10/2016_10/gene.mouse.M4.mm10.RNAseq.2016_10_07.json.gz")

    for assembly in ["mm10", "hg19"]:
        inFnp = fnps[assembly]
        outFnp = inFnp + ".csv.gz"

        if not os.path.exists(outFnp):
            printt("missing", outFnp)
            cmds = [os.path.join(os.path.dirname(__file__),
                                 "json_parser/bin/read_json"),
                    inFnp]
            print("writing csv from", inFnp)
            Utils.runCmds(cmds)
        else:
            print("using", outFnp)
            
        DBCONN = db_connect(os.path.realpath(__file__))
        with getcursor(DBCONN, "08_setup_log") as curs:
            setupAndCopy(curs, assembly, outFnp)

if __name__ == '__main__':
    main()