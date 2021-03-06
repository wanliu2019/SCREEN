#!/usr/bin/env python

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function
import os
import sys
import json
import psycopg2
import re
import argparse
import gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt, printWroteNumLines
from db_utils import getcursor, vacumnAnalyze, makeIndex
from files_and_paths import Dirs, Tools, Genome, Datasets
from exp import Exp

AddPath(__file__, '../common/')
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS
from config import Config


class DumpAccessions:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.fileIDs = set()

    def _print(self, tableName):
        self.curs.execute("""
SELECT fileID
from {tn}
        """.format(tn=tableName))
        for r in self.curs.fetchall():
            self.fileIDs.add(r[0])

    def _ge(self):
        tableName = "r_rnas_" + self.assembly
        self.curs.execute("""
SELECT encode_id
from {tn}
        """.format(tn=tableName))
        expIDs = [r[0] for r in self.curs.fetchall()]

        for expID in expIDs:
            exp = Exp.fromJsonFile(expID)
            for f in exp.files:
                if self.assembly == f.assembly:
                    if f.isGeneQuantifications():
                        self.fileIDs.add(f.fileID)

    def run(self):
        self._print(self.assembly + "_datasets")

        if "hg19" == self.assembly:
            self._print(self.assembly + "_rampage_info")

        self._ge()

        self.fileIDs.add("ENCFF471EYL")  # Hi-C
        printt("found", len(self.fileIDs))
        return self.fileIDs

    def _printExpID(self, tableName):
        self.curs.execute("""
SELECT expID
from {tn}
        """.format(tn=tableName))
        return set([r[0] for r in self.curs.fetchall()])

    def justForCRes(self):
        expIDs = self._printExpID(self.assembly + "_datasets")
        for expID in expIDs:
            try:
                exp = Exp.fromJsonFile(expID)
            except:
                print("ERROR with " + expID)
                raise

        printt("found", len(expIDs))
        return expIDs


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--sample', action="store_true", default=False)
    parser.add_argument('--just', action="store_true", default=False)
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    d = "/home/mjp/Dropbox/0_accessionsV4/"

    if args.just:
        expIDs = set()
        for assembly in assemblies:
            print('***********', assembly)
            with getcursor(DBCONN, "DumpAccessions") as curs:
                da = DumpAccessions(curs, assembly)
                expIDs = expIDs.union(da.justForCRes())
        outFnp = os.path.join(d, "v10_exp_accessions_just_cREs.txt")
        with open(outFnp, 'w') as f:
            f.write('\n'.join(sorted(expIDs)))
        printWroteNumLines(outFnp)
        return

    fileIDs = set()
    for fnp in ["/home/mjp/Dropbox/0_accessionsV4/arjan.tsv",
                "/home/mjp/Dropbox/0_accessionsV4/peaks.txt"]:
        with open(fnp) as f:
            ids = [x.strip() for x in f]
            ids = filter(lambda x: x, ids)
            printt(fnp, len(ids))
            ids = set(ids)
            printt(fnp, len(ids), "unique")
            fileIDs = fileIDs.union(ids)

    for assembly in assemblies:
        print('***********', assembly)
        with getcursor(DBCONN, "DumpAccessions") as curs:
            da = DumpAccessions(curs, assembly)
            fileIDs = fileIDs.union(da.run())

    printt("found", len(fileIDs), "total")
    fileIDs = filter(lambda x: x.startswith("ENCFF"), fileIDs)
    printt("found", len(fileIDs), "total unique")

    outFnp = os.path.join(d, "v10_file_accessions.txt")
    with open(outFnp, 'w') as f:
        f.write('\n'.join(sorted(fileIDs)))
    printWroteNumLines(outFnp)

    return 0


if __name__ == '__main__':
    main()
