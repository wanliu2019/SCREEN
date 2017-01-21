#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs

def setupEnrichment(curs, tableName):
    curs.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName}(
id serial PRIMARY KEY,
study text,
accession text,
val1 numeric,
val2 numeric,
ld text
);
""".format(tableName = tableName))

def setupGWAS(curs, tableName):
    """ chr1    62963737        62963737        rs1002687       rs11207995      0.85    25961943-2      Cholesterol     25961943        Surakka"""
    curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}(
id serial PRIMARY KEY,
chrom text,
start integer,
stop integer,
dbsnp1 text,
dbsnp2 text,
val1 text,
val2 text,
study text,
val3 text,
val4 text
);
""".format(tableName = tableName))

def setupAll(curs):
    dataF = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/"
    dataF = os.path.join(dataF, "GWAS")

    fnp = os.path.join(dataF, "GWAS.Enrichment.v0.txt")
    tableName = "hg19_gwas_enrichment"
    setupEnrichment(curs, tableName)

    cols = ["study", "accession", "val1", "val2", "ld"]
    with open(fnp) as f:
        curs.copy_from(f, tableName, '\t', columns=cols)
    print("\tcopied in", fnp)

    fnp = os.path.join(dataF, "GWAS.v0.bed")
    tableName = "hg19_gwas"
    setupGWAS(curs, tableName)

    cols = "chrom start stop dbsnp1 dbsnp2 val1 val2 study val3 val4".split(' ')
    with open(fnp) as f:
        curs.copy_from(f, tableName, '\t', columns=cols)
    print("\tcopied in", fnp)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    with getcursor(DBCONN, "main") as curs:
        setupAll(curs)

if __name__ == '__main__':
    main()