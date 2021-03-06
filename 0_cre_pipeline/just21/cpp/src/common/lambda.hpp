//
// SPDX-License-Identifier: MIT
// Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
//

#pragma once

namespace SCREEN {

  typedef std::function<bool (std::vector<std::string>&)> RegionFilter;

  RegionFilter QFilter(float);

} // SCREEN
