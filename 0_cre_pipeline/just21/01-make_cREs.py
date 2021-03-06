#!/usr/bin/env python

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function
import os
import sys
import ujson as json
import argparse
import fileinput
import StringIO
import gzip
import random
import numpy
import math

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from common import printr, printt
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils, printWroteNumLines, printt
from peaks import Peaks
from exp import Exp
from files_and_paths import Tools


class Just21:
    def __init__(self, assembly):
        self.assembly = assembly
        self.d = os.path.join(paths.v4d, "just21")
        self.testbed = os.path.join(self.d, "rDHSs/masterPeaks.bed.final")
        self.dz = os.path.join(self.d, "zscores")
        self.allExps = self._parse()

    def _parse(self):
        fnp = os.path.join(self.d, "list.txt")
        with open(fnp) as f:
            header = f.readline().rstrip('\n').split('\t')
            ctToExpIDsRows = [line.rstrip('\n').split('\t') for line in f if line]
        allExps = {}
        for ctToExpIDs in ctToExpIDsRows:
            ct = ctToExpIDs[0]
            allExps[ct] = {}
            for idx, expID in enumerate(ctToExpIDs[1:]):
                allExps[ct][header[idx + 1]] = Exp.fromJsonFile(expID)  # , True)
        if 0:
            for ct, exps in allExps.iteritems():
                print(ct, exps["DNase"], exps["H3K4me3"], exps["H3K27ac"], exps["CTCF"])
        return allExps

    @staticmethod
    def _process(outputbed):
        sig = [[], []]
        masterPeak = []
        calculate = []
        retval = {}
        bed = open(outputbed)
        for line in bed:
            line = line.rstrip().split("\t")
            if float(line[4]) == 0:
                sig[1].append("Zero")
                sig[0].append((float(line[4])))
                masterPeak.append(line[0])
            else:
                sig[1].append(math.log(float(line[4]) + 0.01, 10))
                sig[0].append((float(line[4])))
                calculate.append(math.log(float(line[4]), 10))
                masterPeak.append(line[0])
        lmean = numpy.mean(calculate)
        lstd = numpy.std(calculate)
        i = 0
        for entry in sig[1]:
            if entry != "Zero":
                retval[masterPeak[i]] = ((entry - lmean) / lstd, sig[0][i], sig[1][i])
            else:
                retval[masterPeak[i]] = (-10, 0, -10)
            i += 1
        bed.close()
        return retval

    def zscores(self, bedfnp):
        printt("expanding peaks..")
        peaks = Peaks.fromFnp(self.assembly, bedfnp)
        epeaks = peaks.transformExtendPeaks(500)
        ebfnp = os.path.join(self.dz, os.path.basename(bedfnp).replace(".bed", ".expanded.bed"))
        epeaks.write(ebfnp)
        printWroteNumLines(ebfnp)

        retval = {}
        for ct, value in self.allFiles.iteritems():
            retval[ct] = {}
            for assay, efnp in value.iteritems():
                onp = os.path.basename(efnp) + ".bed"
                printt(efnp, onp)
                if assay.startswith("H3K"):
                    cmds = [Tools.bigWigAverageOverBed,
                            efnp, ebfnp, os.path.join(self.dz, onp)]
                else:
                    cmds = [Tools.bigWigAverageOverBed,
                            efnp, bedfnp, os.path.join(self.dz, onp)]
                Utils.runCmds(cmds)
                retval[ct][assay] = Just21._process(os.path.join(self.dz, onp))
        return retval

    def run(self):
        self.allFiles = {}
        for ct, exps in self.allExps.iteritems():
            self.allFiles[ct] = {}
            for assay in ["DNase", "H3K27ac", "H3K4me3", "CTCF"]:
                exp = exps[assay]
                f = exp.getDccUniformProcessedBigWig("hg19")
                if not f:
                    f = exp.bigWigFilters("hg19")
                    if len(f) != 1:
                        print("missing", ct, assay, exp.encodeID)
                        continue
                    # raise Exception("could not find", ct, assay, exp.encodeID)
                f[0].download()
                self.allFiles[ct][assay] = f[0].fnp()
                #print(ct, assay, f[0].fnp())


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--assembly', type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    assemblies = ["hg19"]  # Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print("**********", assembly)
        j = Just21(assembly)
        j.run()
        scores = j.zscores(j.testbed)

        fnp = os.path.join(paths.v4d, "just21", "test_zscores.json")
        with open(fnp, "wb") as f:
            f.write(json.dumps(scores))

    return 0


if __name__ == '__main__':
    sys.exit(main())
