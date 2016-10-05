//	Copyright 2016 Paul Broadhead
//	Contact: pjbroad@twinmoons.org.uk
//
//	This file is part of meters.
//
//	Meters is free software: you can redistribute it and/or modify
//	it under the terms of the GNU General Public License as published by
//	the Free Software Foundation, either version 3 of the License, or
//	(at your option) any later version.
//
//	Meters is distributed in the hope that it will be useful,
//	but WITHOUT ANY WARRANTY; without even the implied warranty of
//	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//	GNU General Public License for more details.
//
//	You should have received a copy of the GNU General Public License
//	along with meters.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

var meters_config = meters_config ||
{
	paths : {"api":"/meters_api"},
	types: [	{"name":"gas", "shortprompt":"Gas", "prompt":"Gas", "overflow":100000},
				{"name":"electricity", "shortprompt":"Elec", "prompt":"Electricity", "overflow":100000} ],
}
