#!/usr/bin/env python2

from __future__ import print_function

import sys
import os
import re

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from exp import Exp
from utils import eprint

def makeTrackName(n):
    match = re.search("(.*) {.*}(.*)", n)
    if match:
	n = match.group(1) + match.group(2)
    n = n.replace(" ", "_").replace('(','').replace(')','')
    n = n[:102]
    return n

def makeLongLabel(n):
    match = re.search("(.*) {.*}(.*)", n)
    if match:
	n = match.group(1) + match.group(2)
    return n[:80]

def makeShortLabel(n):
    match = re.search("(.*) {.*}(.*)", n)
    if match:
	n = match.group(1) + match.group(2)
    return n[:17]

def bigWigFilters(assembly, files):
    files = filter(lambda x: x.isBigWig() and x.assembly == assembly, files)

    def fils():
        for ot in ["fold change over control",
                   "signal of unique reads",
                   "plus strand signal of unique reads",
                   "plus strand signal of all reads",
                   "plus strand signal",
                   "minus strand signal of unique reads",
                   "minus strand signal of all reads",
                   "minus strand signal",
                   "raw signal",
                   "wavelet-smoothed signal",
                   "percentage normalized signal"
                   ]:
            yield lambda x: x.output_type == ot and x.isPooled
            for rep in xrange(0, 5):
                yield lambda x: x.output_type == ot and str(rep) in x.bio_rep
            yield lambda x: x.output_type == ot and not x.bio_rep
                
    for bf in fils():
        bigWigs = filter(bf, files)
        if bigWigs:
            return bigWigs

    bfs = [lambda bw: bw.isRawSignal() and bw.bio_rep == '1',
           lambda bw: bw.isRawSignal() and bw.bio_rep == '2',
           lambda bw: bw.isSignal() and bw.bio_rep == '1',
           lambda bw: bw.isSignal() and bw.bio_rep == '2',
           lambda bw: bw.isSignal()
           ]
    
    for bf in bfs:
        bigWigs = filter(bf, files)
        if bigWigs:
            return bigWigs

    eprint("error: no files found after filtering...")
    for f in files:
        eprint(f, not f.bio_rep, [] == f.bio_rep, {} == f.bio_rep)
        
    return None


def main():
    exp = Exp.fromJsonFile('ENCSR966OVF')
    files = bigWigFilters("hg19", exp.files)
    print("found", len(files))
    for f in files:
        print(f)

if __name__ == '__main__':
    main()

