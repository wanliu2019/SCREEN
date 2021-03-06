#!/usr/bin/env python2

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function
import os
import sys
import json
import psycopg2
import re
import argparse
from itertools import groupby
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from get_tss import Genes, Transcripts
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, printt


class AddTSS:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def run(self):
        fnp, filetype = paths.gene_files[self.assembly]
        ts = Transcripts(fnp, filetype)

        rows = []
        for t in ts.getTranscripts():
            tss = t.getTSS()
            rows.append([t.geneid_, tss[0], tss[1],
                         tss[2], tss[3]])

        rows.sort(key=lambda x: x[0])

        ret = []
        for gid, group in groupby(rows, lambda x: x[0]):
            group = list(group)
            if 1 == len(group):
                g = group[0]
                r = [g[0], g[1], str(g[2]), str(g[3])]
                ret.append(r)
                continue
            chroms = list(set([x[1] for x in group]))
            if 1 != len(chroms):
                print("Warning: multiple chroms")
                #raise Exception("mutliple chroms")
                continue
            start = min([x[2] for x in group])
            end = max([x[3] for x in group])
            r = [gid, chroms[0], str(start), str(end)]
            print("merge", end - start)
            ret.append(r)

        print("merged from", len(rows), "to", len(ret))

        tableName = self.assembly + "_tss_info"
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
ensemblid_ver text,
chrom text,
start integer,
stop integer
);""".format(tableName=tableName))

        cols = ["ensemblid_ver", "chrom", "start", "stop"]

        outF = StringIO.StringIO()
        for r in ret:
            outF.write('\t'.join(r) + '\n')
        outF.seek(0)
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        printt("updated", tableName)

        makeIndex(self.curs, tableName, ["ensemblid_ver"])


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "3_cellTypeInfo") as curs:
            at = AddTSS(curs, assembly)
            at.run()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)

    return 0


if __name__ == '__main__':
    main()
